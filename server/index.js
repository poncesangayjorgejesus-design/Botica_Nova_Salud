
import "dotenv/config";
import express from "express";

// Rutas originales del integrante 2
import productosRoutes from "./routes/productos.js";
import asistenteRoutes from "./routes/asistente.js";

// Nueva ruta del catalogo integrado
import catalogoIntegradoRoutes from "./routes/catalogoIntegrado.js";

import asistenteReactRoutes from "./routes/asistenteReact.js";

const app = express();

const PORT = Number(process.env.PORT) || 3001;

// ============================================
// CONFIGURACION DEL SERVIDOR
// ============================================

app.use(express.json());

// ============================================
// COMPROBAR ESTADO DEL SERVIDOR
// ============================================

app.get("/api/health", (req, res) => {
  res.json({
    estado: "ok",
    mensaje: "Bienvenido a NOVA SALUD PRO",
    sistema: "Backend API REST"
  });
});

// ============================================
// RUTAS ORIGINALES
// ============================================

// API de productos del integrante 2
app.use("/api/productos", productosRoutes);

// Asistente inteligente
app.use("/api/asistente", asistenteRoutes);

// ============================================
// RUTAS DE INTEGRACION
// ============================================

// Catalogo para la tienda React
app.use("/api/products", catalogoIntegradoRoutes);

// Asistente de inteligencia artificial para React
app.use("/api/ai/symptoms", asistenteReactRoutes);


// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log(
    `Servidor NOVA SALUD PRO iniciado en http://localhost:${PORT}`
  );
});
