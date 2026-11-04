
import express from "express";


import {
  listarProductos,
  obtenerProductoPorId,
  crearProducto
} from "../repositories/productosRepository.js";


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


 // Obtener productos desde el repositorio
router.get("/", async (req, res) => {
  try {
    const productos = await listarProductos(req.query);

    res.json({
      estado: "ok",
      mensaje: "Busqueda de productos NOVA SALUD PRO",
      productos,
      total: productos.length,
      origen: "Datos de demostracion"
    });
  } catch (error) {
    console.error("Error al consultar productos:", error);

    res.status(500).json({
      estado: "error",
      mensaje: "No se pudieron consultar los productos"
    });
  }
});



 // Consultar un producto por ID desde el repositorio
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Validar el identificador
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        estado: "error",
        mensaje: "El ID debe ser un numero entero positivo"
      });
    }

    // Consultar el repositorio
    const producto = await obtenerProductoPorId(id);

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

  } catch (error) {
    console.error("Error al consultar producto:", error);

    res.status(500).json({
      estado: "error",
      mensaje: "Error interno al consultar el producto"
    });
  }
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
