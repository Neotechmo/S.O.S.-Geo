"use strict";

const AppError = require("../utils/appError");

// Ruta no encontrada (404)
function notFoundHandler(req, res, next) {
  next(
    new AppError(404, `No existe la ruta ${req.method} ${req.originalUrl}`)
  );
}

// Registrar errores en consola
function logErrors(err, req, res, next) {
  console.error("\n--------------------ERROR--------------------");
  console.error("Fecha: ", new Date().toISOString());
  console.error("Metodo: ", req.method);
  console.error("Ruta: ", req.originalUrl);
  console.error("Mensaje: ", err.message);
  if (err.stack) {
    console.error(err.stack);
  }
  console.error("--------------------ERROR--------------------\n");
  next(err);
}

// Respuesta final centralizada de Error
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // Error producido por un JSON mal escrito en el body
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: {
        status: 400,
        message: "El cuerpo del JSON contiene un error de sintaxis",
        details: null,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Error de clave duplicada en MongoDB (E11000)
  if (err && err.code === 11000) {
    const duplicatedFields = Object.keys(err.keyValue || {});
    return res.status(400).json({
      error: {
        status: 400,
        message: "Ya existe un registro con los datos únicos proporcionados",
        details:
          duplicatedFields.length > 0
            ? [`Valor duplicado en: ${duplicatedFields.join(", ")}`]
            : null,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      },
    });
  }

  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500
      ? "Ocurrió un error interno del servidor"
      : err.message;

  res.status(statusCode).json({
    error: {
      status: statusCode,
      message,
      details: err.details || null,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    },
  });
}

module.exports = {
  notFoundHandler,
  logErrors,
  errorHandler,
};
