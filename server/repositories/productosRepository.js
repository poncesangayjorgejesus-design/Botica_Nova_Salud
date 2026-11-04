
import { productosDemo } from "../data/productosDemo.js";

// ============================================
// NOVA SALUD PRO
// REPOSITORIO DE PRODUCTOS
// ============================================

// Normalizar texto para las busquedas
const normalizar = (texto) => {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

// Campos adicionales del catalogo
const camposAdicionales = [
  "precio",
  "stock",
  "presentacion",
  "concentracion",
  "imagenUrl"
];

// Preparar los campos adicionales
const obtenerCamposAdicionales = (
  datos,
  productoActual = {}
) => {
  const resultado = {};

  for (const campo of camposAdicionales) {
    if (Object.hasOwn(datos, campo)) {
      resultado[campo] = datos[campo];
    } else {
      resultado[campo] = productoActual[campo] ?? null;
    }
  }

  return resultado;
};

// ============================================
// GET - LISTAR PRODUCTOS CON FILTROS
// ============================================

export const listarProductos = async (filtros = {}) => {
  const nombre = normalizar(filtros.nombre);
  const categoria = normalizar(filtros.categoria);
  const principioActivo = normalizar(
    filtros.principioActivo
  );

  return productosDemo.filter((producto) => {
    return (
      normalizar(producto.nombre).includes(nombre) &&
      normalizar(producto.categoria).includes(categoria) &&
      normalizar(producto.principioActivo).includes(
        principioActivo
      )
    );
  });
};

// ============================================
// GET - OBTENER PRODUCTO POR ID
// ============================================

export const obtenerProductoPorId = async (id) => {
  return productosDemo.find(
    (producto) => producto.id === Number(id)
  ) ?? null;
};

// ============================================
// POST - CREAR PRODUCTO
// ============================================

export const crearProducto = async (datos) => {

  // Generar ID automatico
  const nuevoId = Math.max(
    0,
    ...productosDemo.map((producto) => producto.id)
  ) + 1;

  // Crear producto con todos sus campos
  const nuevoProducto = {
    id: nuevoId,

    nombre: datos.nombre.trim(),
    categoria: datos.categoria.trim(),
    principioActivo: datos.principioActivo.trim(),

    ...obtenerCamposAdicionales(datos),

    demo: true
  };

  // Guardar en memoria
  productosDemo.push(nuevoProducto);

  return nuevoProducto;
};

// ============================================
// PUT - ACTUALIZAR PRODUCTO
// ============================================

export const actualizarProducto = async (id, datos) => {

  // Buscar producto existente
  const producto = productosDemo.find(
    (item) => item.id === Number(id)
  );

  if (!producto) {
    return null;
  }

  // Actualizar campos principales
  producto.nombre = datos.nombre.trim();
  producto.categoria = datos.categoria.trim();
  producto.principioActivo =
    datos.principioActivo.trim();

  // Actualizar campos adicionales
  // Conserva los valores anteriores si
  // no se envian en la actualizacion.
  Object.assign(
    producto,
    obtenerCamposAdicionales(datos, producto)
  );

  return producto;
};

// ============================================
// DELETE - ELIMINAR PRODUCTO
// ============================================

export const eliminarProducto = async (id) => {

  // Buscar posicion del producto
  const indice = productosDemo.findIndex(
    (producto) => producto.id === Number(id)
  );

  if (indice === -1) {
    return null;
  }

  // Eliminar producto
  const productoEliminado = productosDemo.splice(
    indice,
    1
  )[0];

  return productoEliminado;
};
