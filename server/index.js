
import express from "express";
import productosRoutes from "./routes/productos.js";

const app = express();
const PORT = 3001;

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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
