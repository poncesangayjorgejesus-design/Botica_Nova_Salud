
import express from "express";

import {
  listarProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto
} from "../repositories/productosRepository.js";

import { productosDemo } from "../data/productosDemo.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const productos = await listarProductos(req.query);

    res.json({
      estado: "ok",
      mensaje: "Busqueda de productos NOVA SALUD PRO",
      productos,
      total: productos.length,
      origen: "Datos de demostracion"
    });

  } catch (error) {
    console.error("Error al consultar productos:", error);

    res.status(500).json({
      estado: "error",
      mensaje: "No se pudieron consultar los productos"
    });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        estado: "error",
        mensaje: "El ID debe ser un numero entero positivo"
      });
    }

    const producto = await obtenerProductoPorId(id);

    if (!producto) {
      return res.status(404).json({
        estado: "error",
        mensaje: "Producto no encontrado"
      });
    }

    res.json({
      estado: "ok",
      producto
    });

  } catch (error) {
    console.error("Error al consultar producto:", error);

    res.status(500).json({
      estado: "error",
      mensaje: "Error interno al consultar el producto"
    });
  }
});


router.post("/", async (req, res) => {
  try {
    // Disponible solo para pruebas locales
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        estado: "error",
        mensaje: "Registro de demostracion deshabilitado"
      });
    }

    const { nombre, categoria, principioActivo } = req.body ?? {};

    const campos = {
      nombre,
      categoria,
      principioActivo
    };

    // Validar campos obligatorios
    for (const [campo, valor] of Object.entries(campos)) {
      if (
        typeof valor !== "string" ||
        valor.trim().length < 2 ||
        valor.trim().length > 120
      ) {
        return res.status(400).json({
          estado: "error",
          mensaje: `El campo ${campo} debe tener entre 2 y 120 caracteres`
        });
      }
    }

    // Registrar utilizando el repositorio
    const nuevoProducto = await crearProducto({
      nombre,
      categoria,
      principioActivo
    });

    res.status(201).json({
      estado: "ok",
      mensaje: "Producto registrado correctamente",
      producto: nuevoProducto
    });

  } catch (error) {
    console.error("Error al registrar producto:", error);

    res.status(500).json({
      estado: "error",
      mensaje: "Error interno al registrar el producto"
    });
  }
});


router.put("/:id", async (req, res) => {
  try {
    // Disponible solo para pruebas locales
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        estado: "error",
        mensaje: "Edicion de demostracion deshabilitada"
      });
    }

    const id = Number(req.params.id);

    // Validar identificador
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        estado: "error",
        mensaje: "El ID debe ser un numero entero positivo"
      });
    }

    // Obtener los nuevos datos
    const { nombre, categoria, principioActivo } = req.body ?? {};

    const campos = {
      nombre,
      categoria,
      principioActivo
    };

    // Validar campos
    for (const [campo, valor] of Object.entries(campos)) {
      if (
        typeof valor !== "string" ||
        valor.trim().length < 2 ||
        valor.trim().length > 120
      ) {
        return res.status(400).json({
          estado: "error",
          mensaje: `El campo ${campo} debe tener entre 2 y 120 caracteres`
        });
      }
    }

    // Actualizar utilizando el repositorio
    const productoActualizado = await actualizarProducto(id, {
      nombre,
      categoria,
      principioActivo
    });

    if (!productoActualizado) {
      return res.status(404).json({
        estado: "error",
        mensaje: "Producto no encontrado"
      });
    }

    res.json({
      estado: "ok",
      mensaje: "Producto actualizado correctamente",
      producto: productoActualizado
    });

  } catch (error) {
    console.error("Error al actualizar producto:", error);

    res.status(500).json({
      estado: "error",
      mensaje: "Error interno al actualizar el producto"
    });
  }
});


router.delete("/:id", (req, res) => {
  try {
    // Disponible solo para pruebas locales
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        estado: "error",
        mensaje: "Eliminacion de demostracion deshabilitada"
      });
    }

    const id = Number(req.params.id);

    // Validar identificador
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        estado: "error",
        mensaje: "El ID debe ser un numero entero positivo"
      });
    }

    // Buscar posicion del producto
    const indice = productosDemo.findIndex(
      (producto) => producto.id === id
    );

    if (indice === -1) {
      return res.status(404).json({
        estado: "error",
        mensaje: "Producto no encontrado"
      });
    }

    // Eliminar producto temporalmente
    const productoEliminado = productosDemo.splice(indice, 1)[0];

    res.json({
      estado: "ok",
      mensaje: "Producto eliminado correctamente",
      producto: productoEliminado
    });

  } catch (error) {
    console.error("Error al eliminar producto:", error);

    res.status(500).json({
      estado: "error",
      mensaje: "Error interno al eliminar el producto"
    });
  }
});


export default router;
