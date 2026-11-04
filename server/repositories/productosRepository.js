
import { productosDemo } from "../data/productosDemo.js";

// Normalizar texto para las búsquedas
const normalizar = (texto) => {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

// Obtener productos con filtros
export const listarProductos = async (filtros = {}) => {
  const nombre = normalizar(filtros.nombre);
  const categoria = normalizar(filtros.categoria);
  const principioActivo = normalizar(filtros.principioActivo);

  return productosDemo.filter((producto) => {
    return (
      normalizar(producto.nombre).includes(nombre) &&
      normalizar(producto.categoria).includes(categoria) &&
      normalizar(producto.principioActivo).includes(principioActivo)
    );
  });
};

// Obtener un producto por su ID
export const obtenerProductoPorId = async (id) => {
  return productosDemo.find(
    (producto) => producto.id === Number(id)
  ) ?? null;
};
