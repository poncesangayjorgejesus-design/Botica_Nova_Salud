
/*
  NOVA SALUD PRO
  Servicio de formato de productos

  Prepara los datos para:
  - Tienda web
  - Panel administrativo
  - API REST
  - Futuro catalogo MySQL
*/

// Limpiar campos de texto
const limpiarTexto = (valor) => {
  if (typeof valor !== "string") {
    return null;
  }

  return valor.trim() || null;
};

// Validar cantidades numericas
const validarNumero = (valor) => {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero < 0) {
    return null;
  }

  return numero;
};

// Dar formato uniforme a un producto
export const formatearProducto = (producto) => {

  if (!producto || typeof producto !== "object") {
    return null;
  }

  const precio = validarNumero(producto.precio);
  const stock = validarNumero(producto.stock);

  return {
    id: producto.id ?? null,

    nombre: limpiarTexto(producto.nombre),

    categoria: limpiarTexto(producto.categoria),

    principioActivo: limpiarTexto(
      producto.principioActivo
    ),

    precio: precio,

    stock: Number.isInteger(stock) ? stock : null,

    presentacion: limpiarTexto(
      producto.presentacion
    ),

    concentracion: limpiarTexto(
      producto.concentracion
    ),

    imagenUrl: limpiarTexto(
      producto.imagenUrl
    ),

    demo: producto.demo === true
  };
};

// Dar formato a una lista completa
export const formatearProductos = (productos) => {

  if (!Array.isArray(productos)) {
    return [];
  }

  return productos
    .map(formatearProducto)
    .filter(Boolean);
};
