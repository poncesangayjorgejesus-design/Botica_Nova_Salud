
import "dotenv/config";
import express from "express";
import productosRoutes from "./routes/productos.js";
import asistenteRoutes from "./routes/asistente.js";


const app = express();

const PORT = Number(process.env.PORT) || 3001;


app.use(express.json());

// Comprobar que funciona el servidor
app.get("/api/health", (req, res) => {
  res.json({
    estado: "ok",
    mensaje: "Bienvenido a NOVA SALUD PRO",
    sistema: "Backend API REST"
  });
});

// Rutas de productos
app.use("/api/productos", productosRoutes);

// Ruta del asistente de sintomas
app.use("/api/asistente", asistenteRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
