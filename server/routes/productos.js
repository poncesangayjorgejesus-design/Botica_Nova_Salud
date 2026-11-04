
import express from "express";

import {
  listarProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto
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



 // Registrar productos utilizando el repositorio
router.post("/", async (req, res) => {
  try {
    // Solo para pruebas locales
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        estado: "error",
        mensaje: "Registro de demostracion deshabilitado"
      });
    }

    // Obtener datos del producto
    const { nombre, categoria, principioActivo } = req.body ?? {};

    // Validar los campos obligatorios
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

    // Registrar mediante el repositorio
    const nuevoProducto = await crearProducto({
      nombre,
      categoria,
      principioActivo
    });

    res.status(201).json({
      estado: "ok",
      mensaje: "Producto registrado correctamente",
      producto: nuevoProducto
    });

  } catch (error) {
    console.error("Error al registrar producto:", error);

    res.status(500).json({
      estado: "error",
      mensaje: "Error interno al registrar el producto"
    });
  }
});


 // Actualizar un producto por su ID

// Actualizar un producto utilizando el repositorio
router.put("/:id", async (req, res) => {
  try {
    // Solo para pruebas locales
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        estado: "error",
        mensaje: "Edicion de demostracion deshabilitada"
      });
    }

    // Validar el ID del producto
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        estado: "error",
        mensaje: "El ID debe ser un numero entero positivo"
      });
    }

    // Obtener los datos enviados
    const { nombre, categoria, principioActivo } = req.body ?? {};

    const campos = { nombre, categoria, principioActivo };

    // Validar campos
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

    // Actualizar mediante el repositorio
    const productoActualizado = await actualizarProducto(id, {
      nombre,
      categoria,
      principioActivo
    });

    if (!productoActualizado) {
      return res.status(404).json({
        estado: "error",
        mensaje: "Producto no encontrado"
      });
    }

    res.json({
      estado: "ok",
      mensaje: "Producto actualizado correctamente",
      producto: productoActualizado
    });

  } catch (error) {
    console.error("Error al actualizar producto:", error);

    res.status(500).json({
      estado: "error",
      mensaje: "Error interno al actualizar el producto"
    });
  }
});


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
