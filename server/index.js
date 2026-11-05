
import "dotenv/config";
import express from "express";
import path from "node:path";

// Rutas originales
import productosRoutes from "./routes/productos.js";
import asistenteRoutes from "./routes/asistente.js";

// Rutas integradas
import catalogoIntegradoRoutes from "./routes/catalogoIntegrado.js";
import asistenteReactRoutes from "./routes/asistenteReact.js";

// Módulos administrativos
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import metaRoutes from "./routes/meta.js";
import movimientosRoutes from "./routes/movimientos.js";
import pedidosRoutes from "./routes/pedidos.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(express.json());

// Estado del servidor
app.get("/api/health", (req, res) => {
  res.json({
    estado: "ok",
    mensaje: "Bienvenido a NOVA SALUD PRO",
    sistema: "Backend API REST"
  });
});

// Rutas originales
app.use("/api/productos", productosRoutes);
app.use("/api/asistente", asistenteRoutes);

// Rutas integradas
app.use("/api/products", catalogoIntegradoRoutes);
app.use("/api/ai/symptoms", asistenteReactRoutes);

// Autenticación y administración
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Categorías y presentaciones
app.use("/api/meta", metaRoutes);

// Historial de movimientos
app.use("/api/movements", movimientosRoutes);

// Pedidos administrativos
app.use("/api/orders", pedidosRoutes);

// Servir frontend React
const frontendPath = path.resolve("client/dist");

app.use(express.static(frontendPath));

// Cargar React en las rutas que no sean de la API
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(frontendPath, "index.html"), (error) => {
    if (error) next(error);
  });
});

// Iniciar servidor
app.listen(PORT, process.env.NOVA_HOST || "0.0.0.0", () => {
  console.log(`Servidor NOVA SALUD PRO iniciado en el puerto ${PORT}`);
});
