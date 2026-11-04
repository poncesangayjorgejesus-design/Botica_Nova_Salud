
import express from "express";

const router = express.Router();

// Obtener productos del catálogo
router.get("/", (req, res) => {
  res.json({
    estado: "ok",
    mensaje: "API de productos NOVA SALUD PRO",
    productos: [],
    total: 0
  });
});

export default router;
