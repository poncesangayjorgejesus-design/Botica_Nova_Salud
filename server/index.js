
import "dotenv/config";
import express from "express";

import productosRoutes from "./routes/productos.js";
import asistenteRoutes from "./routes/asistente.js";
import catalogoIntegradoRoutes from "./routes/catalogoIntegrado.js";
import asistenteReactRoutes from "./routes/asistenteReact.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import metaRoutes from "./routes/meta.js";

import movimientosRoutes from "./routes/movimientos.js";

import pedidosRoutes from "./routes/pedidos.js";



const app = express();

const PORT = Number(process.env.PORT) || 3001;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    estado: "ok",
    mensaje: "Bienvenido a NOVA SALUD PRO",
    sistema: "Backend API REST"
  });
});

app.use("/api/productos", productosRoutes);
app.use("/api/asistente", asistenteRoutes);
app.use("/api/products", catalogoIntegradoRoutes);
app.use("/api/ai/symptoms", asistenteReactRoutes);
// Autenticacion del panel administrativo
app.use("/api/auth", authRoutes);
// Panel administrativo protegido
app.use("/api/admin", adminRoutes);

// Categorias y presentaciones del catalogo
app.use("/api/meta", metaRoutes);

// Historial de movimientos administrativos
app.use("/api/movements", movimientosRoutes);

// Solicitudes de productos y pedidos administrativos
app.use("/api/orders", pedidosRoutes);




app.listen(PORT, () => {
  console.log(
    `Servidor NOVA SALUD PRO iniciado en http://localhost:${PORT}`
  );
});
