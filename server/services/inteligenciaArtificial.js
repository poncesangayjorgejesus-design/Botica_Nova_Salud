
import OpenAI from "openai";
import { interpretarSintomas } from "./interpretarSintomas.js";

// Advertencia para consultas de salud
const ADVERTENCIA =
  "Información general, no es un diagnóstico ni una receta. " +
  "Busca atención profesional si los síntomas empeoran. " +
  "Ante dificultad para respirar u otros signos graves, " +
  "busca atención urgente.";

// Servicio de inteligencia artificial
export const analizarConsultaIA = async (mensaje) => {

  // Conservar el intérprete anterior como respaldo
  const resultadoLocal = interpretarSintomas(mensaje);

  const respaldo = {
    ...resultadoLocal,
    origen: "local"
  };

  // Si el mensaje es inválido, no consultar la API
  if (resultadoLocal.estado === "error") {
    return respaldo;
  }

  // Comprobar si la IA externa está configurada
  const iaActiva = process.env.AI_ENABLED === "true";
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const modelo = process.env.OPENAI_MODEL?.trim();

  if (!iaActiva || !apiKey || !modelo) {
    return respaldo;
  }

  try {
    // Cliente disponible solo en el backend
    const cliente = new OpenAI({
      apiKey,
      timeout: 10000,
      maxRetries: 0
    });

    // Enviar la consulta a la IA
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

    const datos = JSON.parse(respuesta.output_text ?? "");

    // Validar la respuesta de la IA
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

    if (datos.estado === "aclaracion") {
      return {
        estado: "aclaracion",
        mensaje: datos.explicacion.slice(0, 400),
        diagnostico: false,
        advertencia: ADVERTENCIA,
        origen: "ia"
      };
    }

    return {
      estado: "ok",
      molestia: datos.molestia.slice(0, 100),
      explicacion: datos.explicacion.slice(0, 400),
      diagnostico: false,
      advertencia: ADVERTENCIA,
      origen: "ia"
    };

  } catch (error) {
    console.error("IA externa no disponible. Usando respaldo local.");
    return respaldo;
  }
};
