
import OpenAI from "openai";
import { interpretarSintomas } from "./interpretarSintomas.js";

// ============================================
// ADVERTENCIAS DE SALUD
// ============================================

const ADVERTENCIA =
  "Información general, no es un diagnóstico ni una receta. " +
  "Busca atención profesional si los síntomas empeoran. " +
  "Ante dificultad para respirar u otros signos graves, " +
  "busca atención urgente.";

// ============================================
// SERVICIO DE INTELIGENCIA ARTIFICIAL
// ============================================

export const analizarConsultaIA = async (mensaje) => {

  // Mantener el intérprete local como respaldo
  const resultadoLocal = interpretarSintomas(mensaje);

  const respaldo = {
    ...resultadoLocal,
    origen: "local"
  };

  // Validar el mensaje recibido
  if (resultadoLocal.estado === "error") {
    return respaldo;
  }

  // ============================================
  // VERIFICAR CONFIGURACIÓN DE OPENAI
  // ============================================

  const iaActiva = process.env.AI_ENABLED === "true";
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const modelo = process.env.OPENAI_MODEL?.trim() || process.env.NOVA_AI_MODEL?.trim() || 'gpt-4o-mini';

  if (!iaActiva || !apiKey || !modelo) {
    console.log("IA externa sin configurar. Usando respaldo local.");
    return respaldo;
  }

  try {

    // ============================================
    // CREAR CLIENTE OPENAI
    // ============================================

    const cliente = new OpenAI({
      apiKey,
      timeout: 10000,
      maxRetries: 0
    });

    // ============================================
    // ENVIAR CONSULTA A LA IA
    // ============================================

    const respuesta = await cliente.responses.create({
      model: modelo,

      instructions: `
Eres un asistente informativo del proyecto NOVA SALUD PRO.

Interpreta molestias expresadas en español peruano.
Reconoce errores ortográficos y expresiones coloquiales.

No afirmes diagnósticos.
No prescribas medicamentos ni dosis.
No inventes productos, precios ni existencias.

Si hay ambigüedad, solicita aclaración.
Si hay signos graves, indica buscar atención urgente.

Responde únicamente con un objeto JSON válido:

{
  "estado": "ok",
  "molestia": "Nombre de la molestia",
  "explicacion": "Explicación breve"
}

Si no puedes identificar la molestia, usa:

{
  "estado": "aclaracion",
  "molestia": "",
  "explicacion": "Pregunta breve para aclarar"
}
      `,

      input: mensaje,
      max_output_tokens: 250,
      store: false
    });

    // ============================================
    // PROCESAR RESPUESTA
    // ============================================

    const contenido = respuesta.output_text ?? "";

    if (!contenido.trim()) {
      throw new Error(
        "La IA no devolvió texto para procesar"
      );
    }

    const datos = JSON.parse(contenido);

    // Validar los datos recibidos
    if (
      !["ok", "aclaracion"].includes(datos.estado) ||
      typeof datos.explicacion !== "string" ||
      datos.explicacion.trim().length < 3 ||
      (
        datos.estado === "ok" &&
        (
          typeof datos.molestia !== "string" ||
          !datos.molestia.trim()
        )
      )
    ) {
      throw new Error("Respuesta de IA no válida");
    }

    // ============================================
    // RESPUESTA QUE REQUIERE ACLARACIÓN
    // ============================================

    if (datos.estado === "aclaracion") {
      return {
        estado: "aclaracion",
        mensaje: datos.explicacion.slice(0, 400),
        diagnostico: false,
        advertencia: ADVERTENCIA,
        origen: "ia"
      };
    }

    // ============================================
    // RESPUESTA CORRECTA DE LA IA
    // ============================================

    return {
      estado: "ok",
      molestia: datos.molestia.slice(0, 100),
      explicacion: datos.explicacion.slice(0, 400),
      diagnostico: false,
      advertencia: ADVERTENCIA,
      origen: "ia"
    };

  } catch (error) {

    // ============================================
    // MOSTRAR INFORMACIÓN SEGURA DEL ERROR
    // ============================================

    console.error("Error al consultar OpenAI:", {
      estadoHTTP: error?.status ?? null,
      codigo: error?.code ?? null,
      tipo: error?.type ?? null,
      nombre: error?.name ?? null
    });

    // No mostrar claves ni mensajes completos del proveedor
    console.log("Usando el asistente local de respaldo");

    return respaldo;
  }
};
