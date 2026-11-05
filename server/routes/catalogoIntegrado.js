
import express from "express";

import {
  read,
  enriched
} from "../store.js";

const router = express.Router();

// ============================================
// NOVA SALUD PRO
// CATALOGO INTEGRADO PARA REACT
// ============================================

// GET /api/products
// Consultar productos publicados
router.get("/", async (req, res) => {
  try {
    // Obtener productos del almacenamiento
    // JSON local o MySQL segun configuracion
    const catalogo = await read("catalogo");

    // Mostrar solamente productos visibles
    const productosVisibles = catalogo.filter(
      (producto) => producto.visible !== false
    );

    // Calcular stock y preparar datos
    const productos = productosVisibles.map(
      (producto) => enriched(producto)
    );

    // React espera directamente un arreglo
    res.json(productos);

  } catch (error) {
    console.error(
      "Error al consultar el catalogo:",
      error
    );

    res.status(500).json({
      error: "No se pudo cargar el catalogo"
    });
  }
});

export default router;
