
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

 // Registrar un producto en el repositorio
export const crearProducto = async (datos) => {

  // Generar un ID para el producto
  const nuevoId = Math.max(
    0,
    ...productosDemo.map((producto) => producto.id)
  ) + 1;

  // Crear el objeto del producto
  const nuevoProducto = {
    id: nuevoId,
    nombre: datos.nombre.trim(),
    categoria: datos.categoria.trim(),
    principioActivo: datos.principioActivo.trim(),
    demo: true
  };

  // Guardar temporalmente el producto
  productosDemo.push(nuevoProducto);

  return nuevoProducto;
};
