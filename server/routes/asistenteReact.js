
import express from "express";

import {
  analizarConsultaIA
} from "../services/inteligenciaArtificial.js";

const router = express.Router();

// ============================================
// NOVA SALUD PRO
// ASISTENTE COMPATIBLE CON REACT
// ============================================

// POST /api/ai/symptoms

router.post("/", async (req, res) => {
  try {
    const query = req.body?.query;

    // Validar consulta
    if (
      typeof query !== "string" ||
      query.trim().length < 3 ||
      query.length > 250
    ) {
      return res.status(400).json({
        error: "Escribe una consulta válida de 3 a 250 caracteres."
      });
    }

    // Consultar nuestra IA existente
    const resultado = await analizarConsultaIA(
      query.trim()
    );

    const reconocido = resultado.estado === "ok";

    const titulo = reconocido
      ? resultado.molestia || "Orientación general"
      : "Necesitamos más información";

    const explicacion = reconocido
      ? resultado.explicacion ||
        "Podemos ofrecer información general sobre la molestia."
      : "No se pudo identificar claramente la molestia.";

    const pregunta = reconocido
      ? "¿Desde cuándo tienes esta molestia y qué otros síntomas presentas?"
      : resultado.mensaje ||
        resultado.explicacion ||
        "¿Puedes describir con más detalle lo que sientes?";

    const advertencia =
      typeof resultado.advertencia === "string"
        ? resultado.advertencia
        : "Si los síntomas empeoran o aparecen signos graves, busca atención médica.";

    // Formato que necesita el frontend React
    res.json({
      title: titulo,
      explanation: explicacion,

      causes: [],

      followup: pregunta,

      warnings: [advertencia],

      urgent: resultado.urgente === true,

      ambiguous: !reconocido,

      disclaimer:
        "Información general de carácter académico. " +
        "No constituye un diagnóstico ni una receta médica.",

      mode: resultado.origen === "ia"
        ? "ia"
        : "local",

      notice: resultado.origen === "ia"
        ? "Consulta procesada mediante inteligencia artificial."
        : "Consulta procesada mediante el intérprete local.",

      // Integraremos los productos desde MySQL
      // en el siguiente módulo.
      products: []
    });

  } catch (error) {
    console.error(
      "Error en el asistente de React:",
      error?.name ?? "Error desconocido"
    );

    res.status(500).json({
      error: "No se pudo procesar la consulta."
    });
  }
});

export default router;
