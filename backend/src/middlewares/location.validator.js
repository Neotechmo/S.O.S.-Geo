"use strict";

const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const { ALLOWED_STATUSES, PHONE_REGEX } = require("../models/location.model");

const ALLOWED_FIELDS = [
  "name",
  "description",
  "category",
  "status",
  "contactPhone",
  "primaryProfessional",
  "latitude",
  "longitude",
];

const REQUIRED_ON_CREATE = [
  "name",
  "description",
  "category",
  "latitude",
  "longitude",
];

const MAX_SEARCH_LENGTH = 80;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidObjectIdString(value) {
  return (
    typeof value === "string" &&
    mongoose.isValidObjectId(value.trim()) &&
    value.trim().length === 24
  );
}

// Convierte a número rechazando booleanos, null y cadenas vacías (Number(true) === 1)
function toNumber(value) {
  if (typeof value === "boolean" || value === null || value === "") {
    return NaN;
  }
  return Number(value);
}

function validateTextField(value, label, min, max, details) {
  if (!isNonEmptyString(value)) {
    details.push(`${label} es obligatorio y debe ser texto`);
    return;
  }

  const length = value.trim().length;
  if (length < min) {
    details.push(`${label} debe tener al menos ${min} caracteres`);
  } else if (length > max) {
    details.push(`${label} no puede superar los ${max} caracteres`);
  }
}

function validateCoordinate(body, field, label, min, max, details) {
  if (body[field] === undefined) {
    return;
  }

  const value = toNumber(body[field]);
  if (!Number.isFinite(value)) {
    details.push(`La ${label} debe ser numérica`);
  } else if (value < min || value > max) {
    details.push(`La ${label} (${value}) debe estar entre ${min} y ${max}`);
  } else {
    body[field] = value;
  }
}

function collectErrors(body, { partial }) {
  const details = [];

  const unknownFields = Object.keys(body).filter(
    (field) => !ALLOWED_FIELDS.includes(field)
  );
  if (unknownFields.length > 0) {
    details.push(`Campos no permitidos: ${unknownFields.join(", ")}`);
  }

  if (partial && Object.keys(body).length === 0) {
    details.push("Debes enviar al menos un campo para actualizar");
    return details;
  }

  if (!partial) {
    REQUIRED_ON_CREATE.forEach((field) => {
      if (body[field] === undefined) {
        details.push(`El campo ${field} es obligatorio`);
      }
    });
  } else if ((body.latitude === undefined) !== (body.longitude === undefined)) {
    // Un punto se mueve completo: no se acepta solo una de las dos coordenadas
    details.push("Para mover la ubicación envía latitude y longitude juntas");
  }

  if (body.name !== undefined) {
    validateTextField(body.name, "El nombre", 4, 80, details);
  }

  if (body.description !== undefined) {
    validateTextField(body.description, "La descripción", 10, 250, details);
  }

  if (body.category !== undefined && !isValidObjectIdString(body.category)) {
    details.push("El campo category debe ser un ObjectId de MongoDB válido");
  }

  if (body.status !== undefined) {
    if (
      typeof body.status !== "string" ||
      !ALLOWED_STATUSES.includes(body.status.trim())
    ) {
      details.push(`El estado debe ser uno de: ${ALLOWED_STATUSES.join(", ")}`);
    }
  }

  if (body.contactPhone !== undefined) {
    if (typeof body.contactPhone !== "string") {
      details.push("El teléfono de contacto debe ser texto");
    } else if (
      body.contactPhone.trim() !== "" &&
      !PHONE_REGEX.test(body.contactPhone.trim())
    ) {
      details.push(
        "El teléfono de contacto debe tener entre 10 y 15 caracteres válidos (dígitos, +, - o espacios)"
      );
    }
  }

  if (
    body.primaryProfessional !== undefined &&
    body.primaryProfessional !== null &&
    body.primaryProfessional !== "" &&
    !isValidObjectIdString(body.primaryProfessional)
  ) {
    details.push(
      "El campo primaryProfessional debe ser un ObjectId de MongoDB válido o null"
    );
  }

  validateCoordinate(body, "latitude", "latitud", -90, 90, details);
  validateCoordinate(body, "longitude", "longitud", -180, 180, details);

  return details;
}

function buildValidator(partial, message) {
  return function validateLocation(req, res, next) {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return next(
        new AppError(400, message, ["El cuerpo debe ser un objeto JSON"])
      );
    }

    const details = collectErrors(body, { partial });
    if (details.length > 0) {
      return next(new AppError(400, message, details));
    }

    next();
  };
}

// GET /api/locations y /geojson: ?search=&category=&status=
function validateLocationQuery(req, res, next) {
  const details = [];
  const { search, category, status } = req.query;

  if (search !== undefined) {
    if (typeof search !== "string") {
      details.push("El parámetro search debe enviarse una sola vez como texto");
    } else if (search.trim().length > MAX_SEARCH_LENGTH) {
      details.push(
        `El parámetro search no puede superar los ${MAX_SEARCH_LENGTH} caracteres`
      );
    }
  }

  if (
    category !== undefined &&
    category !== "" &&
    category !== "all" &&
    !isValidObjectIdString(category)
  ) {
    details.push("El parámetro de filtro category debe ser un ObjectId válido");
  }

  if (
    status !== undefined &&
    status !== "" &&
    status !== "all" &&
    !ALLOWED_STATUSES.includes(status)
  ) {
    details.push(
      `El parámetro de filtro status debe ser uno de: ${ALLOWED_STATUSES.join(", ")}`
    );
  }

  if (details.length > 0) {
    return next(
      new AppError(400, "Parámetros de consulta de ubicaciones inválidos", details)
    );
  }

  next();
}

// POST /api/locations
const validateLocationPayload = buildValidator(
  false,
  "Datos de la ubicación inválidos"
);

// PATCH /api/locations/:id
const validateLocationUpdatePayload = buildValidator(
  true,
  "Datos de actualización de la ubicación inválidos"
);

module.exports = {
  validateLocationPayload,
  validateLocationUpdatePayload,
  validateLocationQuery,
};
