"use strict";

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const routerApi = require("./routes");
const AppError = require("./utils/appError");
const {
  notFoundHandler,
  logErrors,
  errorHandler,
} = require("./middlewares/error.handler");

const app = express();

// ORÍGENES PERMITIDOS (vienen del .env separados por coma)
const allowedOrigins = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS
app.use(
  cors({
    origin(origin, callback) {
      // Postman, REST Client y curl no siempre envían header Origin
      if (!origin) {
        return callback(null, true);
      }

      // Si no se configuraron orígenes, se permite todo en desarrollo
      if (allowedOrigins.length === 0) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new AppError(403, `El origin ${origin} no está permitido por CORS`)
      );
    },
  })
);

// PROCESAR JSON (máximo 100kb por petición)
app.use(express.json({ limit: "100kb" }));

// LOGGER DE PETICIONES Y TIEMPO DE RESPUESTA
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
});

// RUTA PRINCIPAL
app.get("/", (req, res) => {
  res.status(200).json({
    name: "API de S.O.S. Geo",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      categories: "/api/categories",
    },
  });
});

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "El servidor de S.O.S. Geo funciona correctamente",
    timestamp: new Date().toISOString(),
  });
});

// RUTAS DE LA API
routerApi(app);

// MANEJO CENTRALIZADO DE ERRORES (Siempre después de las rutas y en este orden)
app.use(notFoundHandler);
app.use(logErrors);
app.use(errorHandler);

module.exports = app;
