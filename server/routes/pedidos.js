
import express from "express";

import {
  read,
  write,
  transaction,
  id,
  round,
  stock,
  takeStock,
  audit
} from "../store.js";

import {
  requerirSesionAdmin
} from "./auth.js";

const router = express.Router();

// ============================================
// NOVA SALUD PRO
// API DE PEDIDOS - PROYECTO ACADEMICO
// ============================================

function errorSolicitud(mensaje, estado = 400) {
  const error = new Error(mensaje);
  error.status = estado;
  return error;
}

// ============================================
// GET /api/orders
// CONSULTAR PEDIDOS - SOLO ADMINISTRADOR
// ============================================

router.get("/", requerirSesionAdmin, async (req, res) => {
  try {
    const pedidos = await read("pedidos");

    res.json(pedidos);

  } catch (error) {
    console.error("Error al consultar pedidos:", error);

    res.status(500).json({
      error: "No se pudieron consultar los pedidos."
    });
  }
});

// ============================================
// POST /api/orders
// REGISTRAR SOLICITUD DESDE LA TIENDA
// ============================================

router.post("/", async (req, res) => {
  try {
    const { cliente, dni, items } = req.body ?? {};

    // Validar nombre del cliente
    if (
      typeof cliente !== "string" ||
      cliente.trim().length < 3 ||
      cliente.trim().length > 100
    ) {
      throw errorSolicitud(
        "Ingresa un nombre válido de 3 a 100 caracteres."
      );
    }

    // Validar DNI de demostracion
    if (
      typeof dni !== "string" ||
      !/^\d{8}$/.test(dni)
    ) {
      throw errorSolicitud(
        "El DNI debe contener exactamente 8 dígitos."
      );
    }

    // Validar lista de productos
    if (
      !Array.isArray(items) ||
      items.length < 1 ||
      items.length > 30
    ) {
      throw errorSolicitud(
        "La solicitud debe contener entre 1 y 30 productos."
      );
    }

    // Procesar la solicitud dentro de una transaccion
    const nuevoPedido = await transaction(async () => {

      const catalogo = await read("catalogo");
      const pedidos = await read("pedidos");

      const detalles = [];
      const idsUtilizados = new Set();

      let total = 0;

      for (const item of items) {
        const productoId = Number(item?.id);
        const cantidad = Number(item?.qty);

        // Comprobar ID y cantidad
        if (
          !Number.isSafeInteger(productoId) ||
          productoId <= 0 ||
          !Number.isSafeInteger(cantidad) ||
          cantidad < 1 ||
          cantidad > 100
        ) {
          throw errorSolicitud(
            "Los productos o cantidades no son válidos."
          );
        }

        // Evitar productos duplicados
        if (idsUtilizados.has(productoId)) {
          throw errorSolicitud(
            "No repitas productos en la misma solicitud."
          );
        }

        idsUtilizados.add(productoId);

        // Buscar producto en el almacenamiento
        const producto = catalogo.find(
          (p) => Number(p.id) === productoId
        );

        if (!producto || producto.visible === false) {
          throw errorSolicitud(
            "Uno de los productos no está disponible.",
            404
          );
        }

        // Verificar existencias vigentes
        if (stock(producto) < cantidad) {
          throw errorSolicitud(
            `No hay existencias suficientes de ${producto.nombre}.`,
            409
          );
        }

        // El precio siempre viene del servidor
        const precio = Number(producto.precio);

        if (
          !Number.isFinite(precio) ||
          precio < 0
        ) {
          throw new Error(
            "El catálogo contiene un precio incorrecto."
          );
        }

        const precioUnitario = round(precio);
        const subtotal = round(
          precioUnitario * cantidad
        );

        detalles.push({
          id: producto.id,
          nombre: producto.nombre,
          principio: producto.principio || "",
          concentracion: producto.concentracion || "",
          forma: producto.forma || "",
          qty: cantidad,
          precio: precioUnitario,
          subtotal,
          receta: producto.receta || "Por verificar"
        });

        total = round(total + subtotal);
      }

      // Crear solicitud academica
      const pedido = {
        id: id(),
        fecha: new Date().toISOString(),
        cliente: cliente.trim(),
        dni,
        total,
        estado: "Pendiente de revisión",
        procesado: null,
        revisionConfirmada: false,
        nota: "",
        items: detalles
      };

      // Guardar pedido
      await write("pedidos", [
        pedido,
        ...pedidos
      ]);

      // Registrar actividad
      await audit(
        "Solicitud registrada",
        `Pedido ${pedido.id} pendiente de revisión`
      );

      return pedido;
    });

    res.status(201).json({
      id: nuevoPedido.id,
      estado: nuevoPedido.estado,
      total: nuevoPedido.total,
      mensaje: "Solicitud registrada para revisión."
    });

  } catch (error) {
    const estado = [400, 404, 409].includes(error.status)
      ? error.status
      : 500;

    if (estado === 500) {
      console.error("Error al registrar pedido:", error);
    }

    res.status(estado).json({
      error: estado === 500
        ? "No se pudo registrar la solicitud."
        : error.message
    });
  }
});

router.patch(
  "/:id/status",
  requerirSesionAdmin,
  async (req, res) => {
    try {
      const { estado, revisado, recetaRevisada } =
        req.body ?? {};

      const estadosPermitidos = [
        "Aprobado y entregado",
        "Rechazado"
      ];

      if (!estadosPermitidos.includes(estado)) {
        return res.status(400).json({
          error: "Estado de pedido no válido."
        });
      }

      const pedidoActualizado = await transaction(
        async () => {
          const pedidos = await read("pedidos");
          const catalogo = await read("catalogo");

          const pedido = pedidos.find(
            (p) => p.id === req.params.id
          );

          if (!pedido) {
            const error = new Error(
              "Pedido no encontrado."
            );
            error.status = 404;
            throw error;
          }

          if (pedido.estado !== "Pendiente de revisión") {
            const error = new Error(
              "Este pedido ya fue procesado."
            );
            error.status = 409;
            throw error;
          }

          if (estado === "Aprobado y entregado") {
            if (revisado !== true) {
              const error = new Error(
                "Debes confirmar la revisión del pedido."
              );
              error.status = 400;
              throw error;
            }

            const necesitaReceta = pedido.items.some(
              (item) =>
                /receta/i.test(item.receta || "") &&
                !/por verificar|verificar condición/i.test(
                  item.receta || ""
                )
            );

            if (
              necesitaReceta &&
              recetaRevisada !== true
            ) {
              const error = new Error(
                "Debes confirmar la revisión de la receta."
              );
              error.status = 400;
              throw error;
            }

            // Verificar las existencias de todos
            // los productos antes de descontar.
            for (const item of pedido.items) {
              const producto = catalogo.find(
                (p) => Number(p.id) === Number(item.id)
              );

              if (
                !producto ||
                !Number.isInteger(Number(item.qty)) ||
                Number(item.qty) <= 0 ||
                stock(producto) < Number(item.qty)
              ) {
                const error = new Error(
                  "Existencias insuficientes o producto no disponible."
                );
                error.status = 409;
                throw error;
              }
            }

            // Descontar del lote vigente más próximo
            // a vencer.
            for (const item of pedido.items) {
              const producto = catalogo.find(
                (p) => Number(p.id) === Number(item.id)
              );

              takeStock(producto, Number(item.qty));
            }

            await write("catalogo", catalogo);
          }

          pedido.estado = estado;
          pedido.procesado = new Date().toISOString();
          pedido.revisionConfirmada =
            revisado === true;

          await write("pedidos", pedidos);

          await audit(
            "Pedido procesado",
            `Pedido ${pedido.id}: ${estado}`
          );

          return pedido;
        }
      );

      res.json({
        id: pedidoActualizado.id,
        estado: pedidoActualizado.estado,
        mensaje: "Pedido actualizado correctamente."
      });

    } catch (error) {
      const codigo = [400, 404, 409].includes(
        error.status
      ) ? error.status : 500;

      if (codigo === 500) {
        console.error(
          "Error al procesar pedido:",
          error
        );
      }

      res.status(codigo).json({
        error: codigo === 500
          ? "No se pudo procesar el pedido."
          : error.message
      });
    }
  }
);

export default router;
