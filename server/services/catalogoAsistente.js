
import {
  obtenerProductoPorId
} from "../repositories/productosRepository.js";

// ============================================
// NOVA SALUD PRO
// PRODUCTOS INFORMATIVOS DEL CATALOGO
// ============================================

// Normalizar nombres
const normalizar = (texto) => {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

// Asociaciones de demostracion.
// Deben ser revisadas por un profesional
// antes de utilizarse en un entorno real.
const asociacionesDemo = {
  "Congestión nasal": [
    {
      id: 1,
      nombre: "Suero fisiológico"
    }
  ]
};

// ============================================
// CONSULTAR PRODUCTOS EXISTENTES
// ============================================

export const obtenerProductosInformativos = async (molestia) => {

  if (typeof molestia !== "string") {
    return [];
  }

  const asociaciones = asociacionesDemo[molestia] ?? [];

  const resultados = [];

  for (const asociado of asociaciones) {

    // Consultar el repositorio real del sistema
    const producto = await obtenerProductoPorId(asociado.id);

    // No mostrar productos inexistentes
    if (!producto) {
      continue;
    }

    // Evitar asociaciones con productos reemplazados
    if (
      normalizar(producto.nombre) !==
      normalizar(asociado.nombre)
    ) {
      continue;
    }

    // Mostrar exclusivamente datos registrados
    resultados.push({
      id: producto.id,
      nombre: producto.nombre,
      categoria: producto.categoria,
      principioActivo: producto.principioActivo,
      demo: producto.demo === true
    });
  }

  return resultados;
};
