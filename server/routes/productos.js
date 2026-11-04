
import express from "express";

import {
  listarProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} from "../repositories/productosRepository.js";

import {
  formatearProducto,
  formatearProductos
} from "../services/formatearProducto.js";

import {
  validarCamposAdicionalesProducto
} from "../services/validarDatosProducto.js";

const router = express.Router();

// ============================================
// NOVA SALUD PRO - API DE PRODUCTOS
// ============================================

// ============================================
// GET - LISTAR TODOS LOS PRODUCTOS
// ============================================

router.get("/", async (req, res) => {
  try {
    const productos = await listarProductos(req.query);

    const productosFormateados = formatearProductos(productos);

    res.json({
      estado: "ok",
      mensaje: "Busqueda de productos NOVA SALUD PRO",
      productos: productosFormateados,
      total: productosFormateados.length,
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

// ============================================
// GET - OBTENER PRODUCTO POR ID
// ============================================

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        estado: "error",
        mensaje: "El ID debe ser un numero entero positivo"
      });
    }

    const producto = await obtenerProductoPorId(id);

    if (!producto) {
      return res.status(404).json({
        estado: "error",
        mensaje: "Producto no encontrado"
      });
    }

    res.json({
      estado: "ok",
      producto: formatearProducto(producto)
    });

  } catch (error) {
    console.error("Error al consultar producto:", error);

    res.status(500).json({
      estado: "error",
      mensaje: "Error interno al consultar el producto"
    });
  }
});

// ============================================
// POST - REGISTRAR PRODUCTO
// ============================================

router.post("/", async (req, res) => {
  try {

    // Solo disponible en entorno de demostracion
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        estado: "error",
        mensaje: "Registro de demostracion deshabilitado"
      });
    }

    const {
      nombre,
      categoria,
      principioActivo
    } = req.body ?? {};

    // Campos obligatorios
    const campos = {
      nombre,
      categoria,
      principioActivo
    };

    // Validar nombre, categoria y principio activo
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

    // ========================================
    // VALIDAR CAMPOS ADICIONALES
    // ========================================

    const validacion = validarCamposAdicionalesProducto(
      req.body
    );

    if (!validacion.valido) {
      return res.status(400).json({
        estado: "error",
        mensaje: validacion.mensaje
      });
    }

    // ========================================
    // CREAR PRODUCTO
    // ========================================

    const nuevoProducto = await crearProducto({
      nombre: nombre.trim(),
      categoria: categoria.trim(),
      principioActivo: principioActivo.trim(),

      // Precio, stock, presentacion,
      // concentracion e imagen
      ...validacion.datos
    });

    res.status(201).json({
      estado: "ok",
      mensaje: "Producto registrado correctamente",
      producto: formatearProducto(nuevoProducto)
    });

  } catch (error) {
    console.error("Error al registrar producto:", error);

    res.status(500).json({
      estado: "error",
      mensaje: "Error interno al registrar el producto"
    });
  }
});

// ============================================
// PUT - ACTUALIZAR PRODUCTO
// ============================================

router.put("/:id", async (req, res) => {
  try {

    // Solo disponible en entorno de demostracion
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        estado: "error",
        mensaje: "Edicion de demostracion deshabilitada"
      });
    }

    const id = Number(req.params.id);

    // Validar identificador
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        estado: "error",
        mensaje: "El ID debe ser un numero entero positivo"
      });
    }

    const {
      nombre,
      categoria,
      principioActivo
    } = req.body ?? {};

    // Campos obligatorios
    const campos = {
      nombre,
      categoria,
      principioActivo
    };

    // Validar campos principales
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

    // ========================================
    // VALIDAR CAMPOS ADICIONALES
    // ========================================

    const validacion = validarCamposAdicionalesProducto(
      req.body
    );

    if (!validacion.valido) {
      return res.status(400).json({
        estado: "error",
        mensaje: validacion.mensaje
      });
    }

    // ========================================
    // ACTUALIZAR PRODUCTO
    // ========================================

    const productoActualizado = await actualizarProducto(
      id,
      {
        nombre: nombre.trim(),
        categoria: categoria.trim(),
        principioActivo: principioActivo.trim(),

        // Nuevos campos validados
        ...validacion.datos
      }
    );

    if (!productoActualizado) {
      return res.status(404).json({
        estado: "error",
        mensaje: "Producto no encontrado"
      });
    }

    res.json({
      estado: "ok",
      mensaje: "Producto actualizado correctamente",
      producto: formatearProducto(productoActualizado)
    });

  } catch (error) {
    console.error("Error al actualizar producto:", error);

    res.status(500).json({
      estado: "error",
      mensaje: "Error interno al actualizar el producto"
    });
  }
});

// ============================================
// DELETE - ELIMINAR PRODUCTO
// ============================================

router.delete("/:id", async (req, res) => {
  try {

    // Solo disponible en entorno de demostracion
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        estado: "error",
        mensaje: "Eliminacion de demostracion deshabilitada"
      });
    }

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        estado: "error",
        mensaje: "El ID debe ser un numero entero positivo"
      });
    }

    // Eliminar producto del repositorio
    const productoEliminado = await eliminarProducto(id);

    if (!productoEliminado) {
      return res.status(404).json({
        estado: "error",
        mensaje: "Producto no encontrado"
      });
    }

    res.json({
      estado: "ok",
      mensaje: "Producto eliminado correctamente",
      producto: formatearProducto(productoEliminado)
    });

  } catch (error) {
    console.error("Error al eliminar producto:", error);

    res.status(500).json({
      estado: "error",
      mensaje: "Error interno al eliminar el producto"
    });
  }
});

// ============================================
// EXPORTAR RUTAS
// ============================================

export default router;
