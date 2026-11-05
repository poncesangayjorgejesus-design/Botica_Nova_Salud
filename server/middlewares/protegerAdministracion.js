
import { timingSafeEqual } from "node:crypto";

// ============================================
// NOVA SALUD PRO
// PROTECCION ADMINISTRATIVA DE DEMOSTRACION
// ============================================

export const protegerAdministracion = (req, res, next) => {

  // Leer clave privada del servidor
  const claveServidor = process.env.ADMIN_API_KEY;

  // Verificar configuracion
  if (!claveServidor || claveServidor.length < 32) {
    return res.status(503).json({
      estado: "error",
      mensaje: "Seguridad administrativa no configurada"
    });
  }

  // Leer clave enviada en la solicitud
  const claveRecibida = req.get("x-admin-key");

  if (!claveRecibida) {
    return res.status(401).json({
      estado: "error",
      mensaje: "Se requiere autenticacion administrativa"
    });
  }

  // Comparar claves
  const esperado = Buffer.from(claveServidor, "utf8");
  const recibido = Buffer.from(claveRecibida, "utf8");

  const coincide =
    esperado.length === recibido.length &&
    timingSafeEqual(esperado, recibido);

  if (!coincide) {
    return res.status(401).json({
      estado: "error",
      mensaje: "Credenciales administrativas incorrectas"
    });
  }

  // Autorizar solicitud
  next();
};
