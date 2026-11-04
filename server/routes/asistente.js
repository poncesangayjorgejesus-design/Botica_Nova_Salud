
import express from "express";

import {
  analizarConsultaIA
} from "../services/inteligenciaArtificial.js";

const router = express.Router();

// Analizar consultas mediante IA o respaldo local
router.post("/", async (req, res) => {
  try {
    const mensaje = req.body?.mensaje;

    // Validar el mensaje
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

    // Analizar la consulta
    const resultado = await analizarConsultaIA(mensaje);

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
