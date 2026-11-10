
import express from "express";

import { read } from "../store.js";

import { requerirSesionAdmin } from "./auth.js";

const router = express.Router();

// ============================================
// NOVA SALUD PRO
// CATEGORIAS Y PRESENTACIONES
// ============================================

// GET /api/meta
router.get("/", requerirSesionAdmin, async (req, res) => {
  try {
    // Consultar el catalogo almacenado
    const catalogo = await read("catalogo");

    // Obtener categorias sin duplicados
    const categorias = [
      ...new Set(
        catalogo
          .map((producto) => producto.categoria)
          .filter(Boolean)
      )
    ].sort();

    // Obtener presentaciones sin duplicados
    const presentaciones = [
      ...new Set(
        catalogo
          .map((producto) => producto.forma)
          .filter(Boolean)
      )
    ].sort();

    // Respuesta compatible con React
    res.json({
      categorias,
      presentaciones
    });

  } catch (error) {
    console.error(
      "Error al cargar categorias:",
      error
    );

    res.status(500).json({
      error: "No se pudieron cargar los datos."
    });
  }
});

export default router;
