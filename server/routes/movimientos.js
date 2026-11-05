
import express from "express";

import {
  read
} from "../store.js";

import {
  requerirSesionAdmin
} from "./auth.js";

const router = express.Router();

// ============================================
// NOVA SALUD PRO
// API DE MOVIMIENTOS ADMINISTRATIVOS
// ============================================

// Proteger todas las rutas
router.use(requerirSesionAdmin);

// ============================================
// GET /api/movements
// CONSULTAR HISTORIAL DE MOVIMIENTOS
// ============================================

router.get("/", async (req, res) => {
  try {

    // Consultar almacenamiento JSON o MySQL
    const movimientos = await read("movimientos");

    // Verificar los datos recibidos
    if (!Array.isArray(movimientos)) {
      throw new Error(
        "Formato de movimientos incorrecto"
      );
    }

    // Mostrar los movimientos mas recientes
    const historial = [...movimientos]
      .sort((a, b) =>
        String(b.fecha || "").localeCompare(
          String(a.fecha || "")
        )
      )
      .slice(0, 1000);

    // Respuesta compatible con React
    res.json(historial);

  } catch (error) {

    console.error(
      "Error al consultar movimientos:",
      error
    );

    res.status(500).json({
      error: "No se pudo cargar el historial."
    });
  }
});

export default router;
