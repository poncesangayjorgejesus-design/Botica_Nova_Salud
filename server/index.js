
import express from "express";

const app = express();
const PORT = 3001;

app.use(express.json());

// Ruta para comprobar que el servidor funciona
app.get("/api/health", (req, res) => {
  res.json({
    estado: "ok",
    mensaje: "Bienvenido a NOVA SALUD PRO",
    sistema: "Backend API REST"
  });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
