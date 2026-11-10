
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



export const app = express();

const PORT = Number(process.env.PORT) || 3001;

app.disable('x-powered-by');
app.use(express.json({limit:'2mb'}));
app.use((req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');if(req.path.startsWith('/api/'))res.setHeader('Cache-Control','no-store');next()});

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
app.use("/api/ai/chat", asistenteReactRoutes);
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




import path from 'node:path';
import {fileURLToPath} from 'node:url';
app.use('/api',(req,res)=>res.status(404).json({error:'Endpoint no encontrado'}));
const dist=fileURLToPath(new URL('../client/dist/',import.meta.url));
app.use(express.static(dist));
app.get('*',(req,res,next)=>res.sendFile(path.join(dist,'index.html'),e=>e&&next(e)));
app.use((err,req,res,next)=>{const status=err.status||500;res.status(status).json({error:status>=500?'No se pudo completar la operación. Revisa la conexión y configuración del servidor.':err.message})});
if(process.argv[1]===fileURLToPath(import.meta.url)){
 if(process.env.NOVA_STORAGE==='mysql'){const {migrateClinical}=await import('./mysql-store.js');await migrateClinical();}
 app.listen(PORT,process.env.NOVA_HOST||'0.0.0.0',()=>console.log(`NOVA SALUD PRO: http://localhost:${PORT}`));
}
