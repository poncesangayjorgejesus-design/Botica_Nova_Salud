
import express from "express";

import {
  read,
  enriched
} from "../store.js";

import {
  requerirSesionAdmin
} from "./auth.js";

const router = express.Router();

// ============================================
// NOVA SALUD PRO
// API ADMINISTRATIVA
// ============================================

// Todas las rutas necesitan una sesion valida
router.use(requerirSesionAdmin);

// ============================================
// GET /api/admin/products
// CONSULTAR INVENTARIO ADMINISTRATIVO
// ============================================

router.get("/products", async (req, res) => {
  try {
    // Consultar almacenamiento JSON o MySQL
    const catalogo = await read("catalogo");

    // Incluir productos visibles, ocultos y lotes
    const productos = catalogo.map(
      (producto) => enriched(producto, true)
    );

    res.json(productos);

  } catch (error) {
    console.error(
      "Error al cargar inventario administrativo:",
      error
    );

    res.status(500).json({
      error: "No se pudo cargar el inventario."
    });
  }
});

// ============================================
// GET /api/admin/stats
// ESTADISTICAS DEL PANEL ADMINISTRATIVO
// ============================================

router.get("/stats", async (req, res) => {
  try {
    // Obtener informacion del almacenamiento
    const catalogo = await read("catalogo");
    const pedidos = await read("pedidos");
    const movimientos = await read("movimientos");

    // Calcular stock vigente de los productos
    const productos = catalogo.map(
      (producto) => enriched(producto, true)
    );

    // Pedidos aprobados
    const aprobados = pedidos.filter(
      (pedido) =>
        pedido.estado === "Aprobado y entregado"
    );

    // ========================================
    // AGRUPAR PRODUCTOS POR CATEGORIA
    // ========================================

    const categorias = {};

    for (const producto of productos) {
      const categoria = producto.categoria || "Otros";

      categorias[categoria] =
        (categorias[categoria] || 0) + 1;
    }

    // ========================================
    // CALCULAR FECHAS DE VENCIMIENTO
    // ========================================

    const hoy = new Date()
      .toISOString()
      .slice(0, 10);

    const limite = new Date();
    limite.setUTCDate(
      limite.getUTCDate() + 90
    );

    const fechaLimite = limite
      .toISOString()
      .slice(0, 10);

    // ========================================
    // CALCULAR ESTADISTICAS
    // ========================================

    const estadisticas = {
      // Total de productos registrados
      products: productos.length,

      // Productos publicados en la tienda
      visible: productos.filter(
        (producto) => producto.visible !== false
      ).length,

      // Pedidos pendientes de revision
      pending: pedidos.filter(
        (pedido) =>
          pedido.estado === "Pendiente de revisión"
      ).length,

      // Unidades de stock vigente
      units: productos.reduce(
        (total, producto) =>
          total + (Number(producto.stock) || 0),
        0
      ),

      // Pedidos procesados y aprobados
      processed: aprobados.length,

      // Total de ventas de demostracion
      total: aprobados.reduce(
        (total, pedido) =>
          total + (Number(pedido.total) || 0),
        0
      ),

      // Productos con stock minimo o inferior
      low: productos.filter(
        (producto) =>
          Number(producto.stock) <=
          (Number(producto.minimo) || 0)
      ).length,

      // Productos con lotes proximos a vencer
      expiring: productos.filter(
        (producto) =>
          (producto.lotes || []).some(
            (lote) =>
              lote.vencimiento >= hoy &&
              lote.vencimiento <= fechaLimite &&
              Number(lote.cantidad) > 0
          )
      ).length,

      // Ultimos movimientos registrados
      latest: movimientos.slice(0, 5),

      // Cantidad de productos por categoria
      byCategory: Object.entries(categorias)
        .map(([name, count]) => ({
          name,
          count
        }))
        .sort(
          (a, b) => b.count - a.count
        )
    };

    res.json(estadisticas);

  } catch (error) {
    console.error(
      "Error al consultar estadisticas:",
      error
    );

    res.status(500).json({
      error: "No se pudieron cargar las estadísticas."
    });
  }
});

export default router;
