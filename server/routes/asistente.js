
import express from "express";

import { interpretarSintomas } from "../services/interpretarSintomas.js";

const router = express.Router();

// Interpretar una consulta de síntomas
router.post("/", (req, res) => {
  try {
    const mensaje = req.body?.mensaje;

    // Validar que se envíe un mensaje
    if (
      typeof mensaje !== "string" ||
      mensaje.trim().length < 3 ||
      mensaje.length > 250
    ) {
      return res.status(400).json({
        estado: "error",
        mensaje: "Escribe una consulta valida de hasta 250 caracteres"
      });
    }

    // Interpretar el mensaje
    const resultado = interpretarSintomas(mensaje);

    res.json({
      sistema: "NOVA SALUD PRO",
      consulta: mensaje,
      ...resultado
    });

  } catch (error) {
    console.error("Error en el asistente:", error);

    res.status(500).json({
      estado: "error",
      mensaje: "No se pudo procesar la consulta"
    });
  }
});

export default router;
