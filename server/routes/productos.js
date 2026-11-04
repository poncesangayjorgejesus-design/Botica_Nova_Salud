
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

export default router;
