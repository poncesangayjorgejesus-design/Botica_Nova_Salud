
import test from "node:test";
import assert from "node:assert/strict";

import { interpretarSintomas } from "../server/services/interpretarSintomas.js";

const casos = [
  ["Me duele la muela", "Dolor dental"],
  ["Tengo moco", "Congestión nasal"],
  ["Tengo tos", "Tos"],
  ["Me duele la cadera", "Dolor de cadera"],
  ["Me arde la garganta", "Molestia de garganta"],
  ["Me duele la barriga", "Dolor abdominal"],
  ["Estoy con flema", "Presencia de flema"],
  ["Me duele la cabeza", "Dolor de cabeza"]
];

for (const [consulta, esperado] of casos) {
  test(`Reconocer: ${consulta}`, () => {
    const resultado = interpretarSintomas(consulta);

    assert.equal(resultado.estado, "ok");
    assert.equal(resultado.molestia, esperado);
    assert.equal(resultado.diagnostico, false);
  });
}

test("Solicitar aclaracion ante varias molestias", () => {
  const resultado = interpretarSintomas(
    "Me duele la muela y tengo tos"
  );

  assert.equal(resultado.estado, "aclaracion");
});

test("No afirmar sintomas negados", () => {
  const resultado = interpretarSintomas("No tengo tos");

  assert.equal(resultado.estado, "aclaracion");
});
