
 // NOVA SALUD PRO
// Interpretación inicial de síntomas cotidianos

// Normalizar texto recibido
const normalizar = (texto) => {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// Diccionario inicial de molestias
const molestias = [
  {
    nombre: "Dolor dental",
    patron: /\b(muela|muelas|diente|dientes)\b/,
    explicacion: "Se identificó una molestia dental."
  },
  {
    nombre: "Congestión nasal",
    patron: /\b(moco|mocos|congestion|nariz tapada)\b/,
    explicacion: "Se identificó una molestia nasal."
  },
  {
    nombre: "Tos",
    patron: /\b(tos|tosiendo|toser)\b/,
    explicacion: "Se identificó tos."
  },
  {
    nombre: "Dolor de cadera",
    patron: /\b(cadera|caderas)\b/,
    explicacion: "Se identificó una molestia en la cadera."
  },
  {
    nombre: "Molestia de garganta",
    patron: /\b(garganta|ardor de garganta)\b/,
    explicacion: "Se identificó una molestia de garganta."
  },
  {
    nombre: "Dolor abdominal",
    patron: /\b(barriga|estomago|panza)\b/,
    explicacion: "Se identificó una molestia abdominal."
  },
  {
    nombre: "Presencia de flema",
    patron: /\b(flema|flemas)\b/,
    explicacion: "Se identificó presencia de flema."
  },
  {
    nombre: "Dolor de cabeza",
    patron: /\b(cabeza|cefalea)\b/,
    explicacion: "Se identificó una molestia de cabeza."
  }
];

// Función principal del intérprete
export const interpretarSintomas = (mensaje) => {

  // Validar el mensaje
  if (
    typeof mensaje !== "string" ||
    mensaje.trim().length < 3 ||
    mensaje.length > 250
  ) {
    return {
      estado: "error",
      mensaje: "Escribe una consulta válida de hasta 250 caracteres."
    };
  }

  const texto = normalizar(mensaje);

  // Evitar interpretar negaciones simples como síntomas
  if (/\b(no tengo|no siento|ya no tengo|ya no me duele)\b/.test(texto)) {
    return {
      estado: "aclaracion",
      mensaje: "¿Puedes aclarar qué molestias tienes actualmente?"
    };
  }

  // Identificar coincidencias
  const encontradas = molestias.filter(
    (molestia) => molestia.patron.test(texto)
  );

  if (encontradas.length === 0) {
    return {
      estado: "aclaracion",
      mensaje: "No pude identificar la molestia. Descríbela con más detalle."
    };
  }

  if (encontradas.length > 1) {
    return {
      estado: "aclaracion",
      molestias: encontradas.map(item => item.nombre),
      mensaje: "Identifiqué varias molestias. ¿Puedes darme más detalles?"
    };
  }

  const molestia = encontradas[0];

  return {
    estado: "ok",
    molestia: molestia.nombre,
    explicacion: molestia.explicacion,
    diagnostico: false,
    advertencia: "Esta información no es un diagnóstico ni una receta. Si los síntomas son intensos, empeoran o incluyen dificultad para respirar, busca atención profesional."
  };
};
