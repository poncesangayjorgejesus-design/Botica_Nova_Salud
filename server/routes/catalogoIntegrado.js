
import express from "express";

import {
  read,
  write,
  enriched,
  transaction,
  audit,
  id,
  productFields,
  adjustStock,
  nonNegative,
  validDate,
  label
} from "../store.js";

import { requerirSesionAdmin } from "./auth.js";

const router = express.Router();

// ============================================
// NOVA SALUD PRO
// CATALOGO INTEGRADO PARA REACT
// ============================================

// ============================================
// GET /api/products
// CONSULTAR PRODUCTOS VISIBLES
// ============================================

router.get("/", async (req, res) => {
  try {
    const catalogo = await read("catalogo");

    const productosVisibles = catalogo.filter(
      producto => producto.visible !== false
    );

    const productos = productosVisibles.map(
      producto => enriched(producto)
    );

    res.json(productos);

  } catch (error) {
    console.error("Error al consultar el catálogo:", error);

    res.status(500).json({
      error: "No se pudo cargar el catálogo."
    });
  }
});

// ============================================
// POST /api/products
// REGISTRAR PRODUCTO
// ============================================

router.post("/", requerirSesionAdmin, async (req, res) => {
  try {
    const resultado = await transaction(async () => {

      const catalogo = await read("catalogo");

      const nuevoProducto = productFields(req.body || {});

      // La tabla SQL utiliza ID numérico sin AUTO_INCREMENT.
      const mayorId = catalogo.reduce(
        (mayor, producto) => Math.max(
          mayor,
          Number(producto.id) || 0
        ),
        0
      );

      const nuevoId = mayorId + 1;

      if (nuevoId > 4294967295) {
        throw Object.assign(
          new Error("No hay identificadores disponibles."),
          { status: 409 }
        );
      }

      nuevoProducto.id = nuevoId;
      nuevoProducto.lotes = [];

      catalogo.push(nuevoProducto);

      await write("catalogo", catalogo);

      await audit(
        "PRODUCTO CREADO",
        `Se registró el producto ${nuevoProducto.nombre}`
      );

      return enriched(nuevoProducto, true);
    });

    res.status(201).json(resultado);

  } catch (error) {
    console.error("Error al registrar producto:", error);

    res.status(error.status || 500).json({
      error: error.message || "No se pudo registrar el producto."
    });
  }
});

// ============================================
// PATCH /api/products/:id
// EDITAR PRODUCTO
// ============================================

router.patch("/:id", requerirSesionAdmin, async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({
        error: "Identificador de producto inválido."
      });
    }

    const resultado = await transaction(async () => {

      const catalogo = await read("catalogo");

      const producto = catalogo.find(
        item => Number(item.id) === productId
      );

      if (!producto) {
        throw Object.assign(
          new Error("Producto no encontrado."),
          { status: 404 }
        );
      }

      const actualizado = productFields(
        req.body || {},
        producto
      );

      actualizado.id = producto.id;
      actualizado.lotes = producto.lotes || [];

      const posicion = catalogo.findIndex(
        item => Number(item.id) === productId
      );

      catalogo[posicion] = actualizado;

      await write("catalogo", catalogo);

      await audit(
        "PRODUCTO ACTUALIZADO",
        `Se actualizó el producto ${actualizado.nombre}`
      );

      return enriched(actualizado, true);
    });

    res.json(resultado);

  } catch (error) {
    console.error("Error al actualizar producto:", error);

    res.status(error.status || 500).json({
      error: error.message || "No se pudo actualizar el producto."
    });
  }
});

// ============================================
// PATCH /api/products/:id/stock
// AJUSTAR EXISTENCIAS
// ============================================

router.patch("/:id/stock", requerirSesionAdmin, async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({
        error: "Identificador de producto inválido."
      });
    }

    const cantidad = nonNegative(
      req.body?.cantidad,
      "Cantidad de existencias",
      10000000,
      true
    );

    const resultado = await transaction(async () => {

      const catalogo = await read("catalogo");

      const producto = catalogo.find(
        item => Number(item.id) === productId
      );

      if (!producto) {
        throw Object.assign(
          new Error("Producto no encontrado."),
          { status: 404 }
        );
      }

      adjustStock(producto, cantidad);

      await write("catalogo", catalogo);

      await audit(
        "STOCK AJUSTADO",
        `Existencias de ${producto.nombre} ajustadas a ${cantidad}`
      );

      return enriched(producto, true);
    });

    res.json(resultado);

  } catch (error) {
    console.error("Error al ajustar existencias:", error);

    res.status(error.status || 500).json({
      error: error.message || "No se pudieron ajustar las existencias."
    });
  }
});

// ============================================
// POST /api/products/:id/lots
// REGISTRAR LOTE
// ============================================

router.post("/:id/lots", requerirSesionAdmin, async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({
        error: "Identificador de producto inválido."
      });
    }

    const codigo = label(req.body?.codigo);
    const cantidad = nonNegative(
      req.body?.cantidad,
      "Cantidad del lote",
      10000000,
      true
    );

    const vencimiento = req.body?.vencimiento;

    if (!codigo || codigo.length > 50) {
      return res.status(400).json({
        error: "El código del lote es obligatorio y debe tener máximo 50 caracteres."
      });
    }

    if (cantidad < 1) {
      return res.status(400).json({
        error: "La cantidad del lote debe ser mayor que cero."
      });
    }

    if (!validDate(vencimiento)) {
      return res.status(400).json({
        error: "La fecha de vencimiento no es válida."
      });
    }

    const resultado = await transaction(async () => {

      const catalogo = await read("catalogo");

      const producto = catalogo.find(
        item => Number(item.id) === productId
      );

      if (!producto) {
        throw Object.assign(
          new Error("Producto no encontrado."),
          { status: 404 }
        );
      }

      producto.lotes ??= [];

      const nuevoLote = {
        id: id(),
        codigo,
        cantidad,
        vencimiento
      };

      producto.lotes.push(nuevoLote);

      await write("catalogo", catalogo);

      await audit(
        "LOTE REGISTRADO",
        `Nuevo lote ${codigo} para ${producto.nombre}`
      );

      return enriched(producto, true);
    });

    res.status(201).json(resultado);

  } catch (error) {
    console.error("Error al registrar lote:", error);

    res.status(error.status || 500).json({
      error: error.message || "No se pudo registrar el lote."
    });
  }
});

// ============================================
// PATCH /api/products/:id/lots/:lotId
// MODIFICAR LOTE
// ============================================

router.patch("/:id/lots/:lotId", requerirSesionAdmin, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const lotId = req.params.lotId;

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({
        error: "Identificador de producto inválido."
      });
    }

    if (!lotId) {
      return res.status(400).json({
        error: "Identificador de lote inválido."
      });
    }

    const codigo = label(req.body?.codigo);
    const cantidad = nonNegative(
      req.body?.cantidad,
      "Cantidad del lote",
      10000000,
      true
    );

    const vencimiento = req.body?.vencimiento;

    if (!codigo || codigo.length > 50) {
      return res.status(400).json({
        error: "El código del lote es obligatorio y debe tener máximo 50 caracteres."
      });
    }

    if (!validDate(vencimiento)) {
      return res.status(400).json({
        error: "La fecha de vencimiento no es válida."
      });
    }

    const resultado = await transaction(async () => {

      const catalogo = await read("catalogo");

      const producto = catalogo.find(
        item => Number(item.id) === productId
      );

      if (!producto) {
        throw Object.assign(
          new Error("Producto no encontrado."),
          { status: 404 }
        );
      }

      const lote = (producto.lotes || []).find(
        item => String(item.id) === String(lotId)
      );

      if (!lote) {
        throw Object.assign(
          new Error("Lote no encontrado."),
          { status: 404 }
        );
      }

      lote.codigo = codigo;
      lote.cantidad = cantidad;
      lote.vencimiento = vencimiento;

      await write("catalogo", catalogo);

      await audit(
        "LOTE ACTUALIZADO",
        `Se modificó el lote ${codigo} de ${producto.nombre}`
      );

      return enriched(producto, true);
    });

    res.json(resultado);

  } catch (error) {
    console.error("Error al actualizar lote:", error);

    res.status(error.status || 500).json({
      error: error.message || "No se pudo actualizar el lote."
    });
  }
});

export default router;
