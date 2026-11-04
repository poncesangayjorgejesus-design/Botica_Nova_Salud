
import express from "express";
import { productosDemo } from "../data/productosDemo.js";

const router = express.Router();

// Normalizar texto para buscar sin importar tildes
const normalizar = (texto) => {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

// Obtener y buscar productos
router.get("/", (req, res) => {
  const nombre = normalizar(req.query.nombre);
  const categoria = normalizar(req.query.categoria);
  const principioActivo = normalizar(req.query.principioActivo);

  const resultados = productosDemo.filter((producto) => {
    const coincideNombre =
      normalizar(producto.nombre).includes(nombre);

    const coincideCategoria =
      normalizar(producto.categoria).includes(categoria);

    const coincidePrincipio =
      normalizar(producto.principioActivo).includes(principioActivo);

    return coincideNombre &&
           coincideCategoria &&
           coincidePrincipio;
  });

  res.json({
    estado: "ok",
    mensaje: "Busqueda de productos NOVA SALUD PRO",
    productos: resultados,
    total: resultados.length,
    origen: "Datos de demostracion"
  });
});

 // Obtener un producto por su ID
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      estado: "error",
      mensaje: "El ID debe ser un numero entero positivo"
    });
  }

  const producto = productosDemo.find(
    (item) => item.id === id
  );

  if (!producto) {
    return res.status(404).json({
      estado: "error",
      mensaje: "Producto no encontrado"
    });
  }

  res.json({
    estado: "ok",
    producto
  });
});

 // Registrar un nuevo producto
router.post("/", (req, res) => {
  // Disponible solo para pruebas locales
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      estado: "error",
      mensaje: "Registro de demostracion deshabilitado"
    });
  }

  const { nombre, categoria, principioActivo } = req.body ?? {};

  // Validar los datos recibidos
  const campos = { nombre, categoria, principioActivo };

  for (const [campo, valor] of Object.entries(campos)) {
    if (
      typeof valor !== "string" ||
      valor.trim().length < 2 ||
      valor.trim().length > 120
    ) {
      return res.status(400).json({
        estado: "error",
        mensaje: `El campo ${campo} debe tener entre 2 y 120 caracteres`
      });
    }
  }

  // Generar un identificador
  const nuevoId =
    Math.max(0, ...productosDemo.map(p => p.id)) + 1;

  const nuevoProducto = {
    id: nuevoId,
    nombre: nombre.trim(),
    categoria: categoria.trim(),
    principioActivo: principioActivo.trim(),
    demo: true
  };

  // Agregar producto temporalmente
  productosDemo.push(nuevoProducto);

  res.status(201).json({
    estado: "ok",
    mensaje: "Producto registrado correctamente",
    producto: nuevoProducto
  });
});

 // Actualizar un producto por su ID
router.put("/:id", (req, res) => {
  // Solo para pruebas locales
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      estado: "error",
      mensaje: "Edicion de demostracion deshabilitada"
    });
  }

  const id = Number(req.params.id);

  // Validar el ID
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      estado: "error",
      mensaje: "El ID debe ser un numero entero positivo"
    });
  }

  // Buscar el producto
  const producto = productosDemo.find(
    (item) => item.id === id
  );

  if (!producto) {
    return res.status(404).json({
      estado: "error",
      mensaje: "Producto no encontrado"
    });
  }

  // Obtener los nuevos datos
  const { nombre, categoria, principioActivo } = req.body ?? {};

  const campos = { nombre, categoria, principioActivo };

  // Validar los campos
  for (const [campo, valor] of Object.entries(campos)) {
    if (
      typeof valor !== "string" ||
      valor.trim().length < 2 ||
      valor.trim().length > 120
    ) {
      return res.status(400).json({
        estado: "error",
        mensaje: `El campo ${campo} debe tener entre 2 y 120 caracteres`
      });
    }
  }

  // Actualizar los datos
  producto.nombre = nombre.trim();
  producto.categoria = categoria.trim();
  producto.principioActivo = principioActivo.trim();

  res.json({
    estado: "ok",
    mensaje: "Producto actualizado correctamente",
    producto
  });
});

 // Eliminar un producto por su ID
router.delete("/:id", (req, res) => {
  // Solo para pruebas locales
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      estado: "error",
      mensaje: "Eliminacion de demostracion deshabilitada"
    });
  }

  const id = Number(req.params.id);

  // Validar el ID recibido
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      estado: "error",
      mensaje: "El ID debe ser un numero entero positivo"
    });
  }

  // Buscar la posicion del producto
  const indice = productosDemo.findIndex(
    (producto) => producto.id === id
  );

  // Verificar si el producto existe
  if (indice === -1) {
    return res.status(404).json({
      estado: "error",
      mensaje: "Producto no encontrado"
    });
  }

  // Eliminar el producto del arreglo
  const productoEliminado = productosDemo.splice(indice, 1)[0];

  res.json({
    estado: "ok",
    mensaje: "Producto eliminado correctamente",
    producto: productoEliminado
  });
});

export default router;
