
import test from "node:test";
import assert from "node:assert/strict";

import {
  protegerAdministracion
} from "../server/middlewares/protegerAdministracion.js";

// Clave ficticia, exclusiva para las pruebas
const CLAVE_PRUEBA = "A".repeat(64);

// Simular una solicitud al middleware
const probarAcceso = (claveEnviada, claveServidor = CLAVE_PRUEBA) => {
  const claveOriginal = process.env.ADMIN_API_KEY;

  process.env.ADMIN_API_KEY = claveServidor;

  let codigoHTTP = 200;
  let respuesta = null;
  let autorizado = false;

  const req = {
    get: (nombre) => {
      if (nombre === "x-admin-key") {
        return claveEnviada;
      }
      return undefined;
    }
  };

  const res = {
    status(codigo) {
      codigoHTTP = codigo;
      return this;
    },

    json(datos) {
      respuesta = datos;
      return this;
    }
  };

  try {
    protegerAdministracion(req, res, () => {
      autorizado = true;
    });

    return {
      codigoHTTP,
      respuesta,
      autorizado
    };
  } finally {
    if (claveOriginal === undefined) {
      delete process.env.ADMIN_API_KEY;
    } else {
      process.env.ADMIN_API_KEY = claveOriginal;
    }
  }
};

// ============================================
// PRUEBA 1 - SIN CLAVE
// ============================================

test("Rechazar acceso sin clave", () => {
  const resultado = probarAcceso(undefined);

  assert.equal(resultado.codigoHTTP, 401);
  assert.equal(resultado.autorizado, false);
});

// ============================================
// PRUEBA 2 - CLAVE INCORRECTA
// ============================================

test("Rechazar clave incorrecta", () => {
  const resultado = probarAcceso("B".repeat(64));

  assert.equal(resultado.codigoHTTP, 401);
  assert.equal(resultado.autorizado, false);
});

// ============================================
// PRUEBA 3 - CLAVE CORRECTA
// ============================================

test("Permitir clave correcta", () => {
  const resultado = probarAcceso(CLAVE_PRUEBA);

  assert.equal(resultado.codigoHTTP, 200);
  assert.equal(resultado.autorizado, true);
});

// ============================================
// PRUEBA 4 - SERVIDOR SIN CONFIGURACION
// ============================================

test("Bloquear cuando falta configuracion", () => {
  const resultado = probarAcceso(
    CLAVE_PRUEBA,
    "clave-corta"
  );

  assert.equal(resultado.codigoHTTP, 503);
  assert.equal(resultado.autorizado, false);
});
