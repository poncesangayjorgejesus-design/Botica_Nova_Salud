
import express from "express";

import {
  analizarConsultaIA
} from "../services/inteligenciaArtificial.js";

import {
  interpretarSintomas
} from "../services/interpretarSintomas.js";

import {
  obtenerProductosInformativos
} from "../services/catalogoAsistente.js";

const router = express.Router();

// ============================================
// ASISTENTE DE NOVA SALUD PRO
// ============================================

router.post("/", async (req, res) => {
  try {
    const mensaje = req.body?.mensaje;

    // Validar consulta
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

    // Interpretar mediante IA o respaldo local
    const resultado = await analizarConsultaIA(mensaje);

    // Clasificación local para asociaciones revisadas
    const interpretacionLocal = interpretarSintomas(mensaje);

    let productosInformativos = [];

    // Solo consultar asociaciones si la molestia
    // fue reconocida sin ambigüedad
    if (
      resultado.estado === "ok" &&
      interpretacionLocal.estado === "ok"
    ) {
      productosInformativos =
        await obtenerProductosInformativos(
          interpretacionLocal.molestia
        );
    }

    // Respuesta completa del asistente
    res.json({
      sistema: "NOVA SALUD PRO",
      consulta: mensaje,
      ...resultado,
      productosInformativos
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
