
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

export default router;
