
/*
  NOVA SALUD PRO
  Validacion de datos adicionales de productos

  Campos:
  - Precio
  - Stock
  - Presentacion
  - Concentracion
  - Imagen
*/

export const validarCamposAdicionalesProducto = (entrada) => {

  if (
    !entrada ||
    typeof entrada !== "object" ||
    Array.isArray(entrada)
  ) {
    return {
      valido: false,
      mensaje: "Los datos del producto deben ser un objeto"
    };
  }

  const datos = {};

  // =========================================
  // VALIDAR PRECIO
  // =========================================

  if (Object.hasOwn(entrada, "precio")) {
    const precio = entrada.precio;

    if (precio === null) {
      datos.precio = null;

    } else if (
      typeof precio !== "number" ||
      !Number.isFinite(precio) ||
      precio < 0 ||
      !/^\d+(\.\d{1,2})?$/.test(String(precio))
    ) {
      return {
        valido: false,
        mensaje: "El precio debe ser un numero positivo o cero, con maximo 2 decimales"
      };

    } else {
      datos.precio = precio;
    }
  }

  // =========================================
  // VALIDAR STOCK
  // =========================================

  if (Object.hasOwn(entrada, "stock")) {
    const stock = entrada.stock;

    if (stock === null) {
      datos.stock = null;

    } else if (
      typeof stock !== "number" ||
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      return {
        valido: false,
        mensaje: "El stock debe ser un numero entero mayor o igual a cero"
      };

    } else {
      datos.stock = stock;
    }
  }

  // =========================================
  // VALIDAR PRESENTACION Y CONCENTRACION
  // =========================================

  for (const campo of ["presentacion", "concentracion"]) {

    if (!Object.hasOwn(entrada, campo)) {
      continue;
    }

    const valor = entrada[campo];

    if (valor === null || valor === "") {
      datos[campo] = null;
      continue;
    }

    if (
      typeof valor !== "string" ||
      valor.trim().length > 120
    ) {
      return {
        valido: false,
        mensaje: `El campo ${campo} debe ser un texto de hasta 120 caracteres`
      };
    }

    datos[campo] = valor.trim() || null;
  }

  // =========================================
  // VALIDAR IMAGEN DEL PRODUCTO
  // =========================================

  if (Object.hasOwn(entrada, "imagenUrl")) {

    const imagenUrl = entrada.imagenUrl;

    if (imagenUrl === null || imagenUrl === "") {
      datos.imagenUrl = null;

    } else if (
      typeof imagenUrl !== "string" ||
      imagenUrl.length > 2048
    ) {
      return {
        valido: false,
        mensaje: "La imagen debe tener una URL valida"
      };

    } else {
      try {
        const url = new URL(imagenUrl.trim());

        if (url.protocol !== "https:") {
          return {
            valido: false,
            mensaje: "La imagen debe utilizar una URL HTTPS"
          };
        }

        datos.imagenUrl = url.href;

      } catch {
        return {
          valido: false,
          mensaje: "La URL de la imagen no es valida"
        };
      }
    }
  }

  // =========================================
  // RESULTADO
  // =========================================

  return {
    valido: true,
    datos
  };
};
