
import express from "express";
import {
  randomBytes,
  createHash,
  timingSafeEqual
} from "node:crypto";

const router = express.Router();

// NOVA SALUD PRO - AUTENTICACION ADMINISTRATIVA

const COOKIE = "nova_admin_session";
const DURACION = 8 * 60 * 60 * 1000;
const VENTANA = 15 * 60 * 1000;
const MAX_INTENTOS = 10;

const sesiones = new Map();
const intentos = new Map();

const hash = (valor) =>
  createHash("sha256")
    .update(valor)
    .digest("hex");

function compararSeguro(a, b) {
  const primero = Buffer.from(hash(a), "hex");
  const segundo = Buffer.from(hash(b), "hex");

  return timingSafeEqual(primero, segundo);
}

function opcionesCookie() {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "strict",
    path: "/"
  };
}

function obtenerToken(req) {
  const cookies = (req.headers.cookie || "").split(";");

  const encontrada = cookies.find((item) =>
    item.trim().startsWith(COOKIE + "=")
  );

  if (!encontrada) return null;

  return encontrada.trim().slice(COOKIE.length + 1);
}

function sesionValida(req) {
  const token = obtenerToken(req);

  if (!token) return false;

  const clave = hash(token);
  const vencimiento = sesiones.get(clave);

  if (!vencimiento) return false;

  if (Date.now() >= vencimiento) {
    sesiones.delete(clave);
    return false;
  }

  return true;
}

// Middleware reutilizable para proteger
// las futuras rutas administrativas
export function requerirSesionAdmin(req, res, next) {
  if (!sesionValida(req)) {
    return res.status(401).json({
      error: "Se requiere iniciar sesión como administrador."
    });
  }

  next();
}

// POST /api/auth/login
router.post("/login", (req, res) => {
  const claveServidor = process.env.NOVA_ADMIN_PASSWORD;

  if (
    !claveServidor ||
    claveServidor.length < 12 ||
    claveServidor.startsWith("CAMBIAR_POR")
  ) {
    return res.status(503).json({
      error: "La contraseña administrativa no está configurada."
    });
  }

  const password = req.body?.password;

  if (
    typeof password !== "string" ||
    password.length > 512
  ) {
    return res.status(400).json({
      error: "Credenciales inválidas."
    });
  }

  // Limitar intentos de inicio de sesión
  const ip = req.ip || "desconocida";
  const ahora = Date.now();

  let registro = intentos.get(ip);

  if (!registro || ahora >= registro.hasta) {
    registro = {
      cantidad: 0,
      hasta: ahora + VENTANA
    };
  }

  if (registro.cantidad >= MAX_INTENTOS) {
    return res.status(429).json({
      error: "Demasiados intentos. Intenta más tarde."
    });
  }

  if (!compararSeguro(password, claveServidor)) {
    registro.cantidad++;
    intentos.set(ip, registro);

    return res.status(401).json({
      error: "Contraseña incorrecta."
    });
  }

  intentos.delete(ip);

  // Crear una sesión aleatoria
  const token = randomBytes(32).toString("hex");

  sesiones.set(
    hash(token),
    Date.now() + DURACION
  );

  res.cookie(COOKIE, token, {
    ...opcionesCookie(),
    maxAge: DURACION
  });

  return res.json({
    authenticated: true,
    mensaje: "Sesión iniciada correctamente."
  });
});

// GET /api/auth/status
router.get("/status", (req, res) => {
  res.json({
    authenticated: sesionValida(req)
  });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  const token = obtenerToken(req);

  if (token) {
    sesiones.delete(hash(token));
  }

  res.clearCookie(COOKIE, opcionesCookie());

  res.json({
    authenticated: false,
    mensaje: "Sesión cerrada correctamente."
  });
});

export default router;
