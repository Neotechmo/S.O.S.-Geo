"use strict";

const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const {
  ALLOWED_PRIORITIES,
  ALLOWED_STATUSES,
  PHONE_REGEX,
} = require("../models/service-request.model");

const ALLOWED_FIELDS = [
  "title",
  "description",
  "priority",
  "status",
  "contactName",
  "contactPhone",
  "category",
  "location",
  "professional",
];

const REQUIRED_ON_CREATE = [
  "title",
  "description",
  "contactName",
  "contactPhone",
  "category",
  "location",
];

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
  }

  if (body.title !== undefined) {
    validateTextField(body.title, "El título", 4, 90, details);
  }

  if (body.description !== undefined) {
    validateTextField(body.description, "La descripción", 10, 300, details);
  }

  if (body.priority !== undefined) {
    if (
      typeof body.priority !== "string" ||
      !ALLOWED_PRIORITIES.includes(body.priority.trim())
    ) {
      details.push(
        `La prioridad debe ser una de: ${ALLOWED_PRIORITIES.join(", ")}`
      );
    }
  }

  if (body.status !== undefined) {
    if (
      typeof body.status !== "string" ||
      !ALLOWED_STATUSES.includes(body.status.trim())
    ) {
      details.push(`El estado debe ser uno de: ${ALLOWED_STATUSES.join(", ")}`);
    }
  }

  if (body.contactName !== undefined) {
    validateTextField(body.contactName, "El nombre de contacto", 3, 80, details);
  }

  if (body.contactPhone !== undefined) {
    if (
      typeof body.contactPhone !== "string" ||
      !PHONE_REGEX.test(body.contactPhone.trim())
    ) {
      details.push(
        "El teléfono de contacto debe tener entre 10 y 15 caracteres válidos (dígitos, +, - o espacios)"
      );
    }
  }

  if (body.category !== undefined && !isValidObjectIdString(body.category)) {
    details.push("El campo category debe ser un ObjectId de MongoDB válido");
  }

  if (body.location !== undefined && !isValidObjectIdString(body.location)) {
    details.push("El campo location debe ser un ObjectId de MongoDB válido");
  }

  if (
    body.professional !== undefined &&
    body.professional !== null &&
    body.professional !== ""
  ) {
    if (!isValidObjectIdString(body.professional)) {
      details.push(
        "El campo professional debe ser un ObjectId de MongoDB válido o null"
      );
    }
  }

  return details;
}

function buildValidator(partial, message) {
  return function validateServiceRequest(req, res, next) {
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

function validateServiceRequestQuery(req, res, next) {
  const details = [];
  const { status, priority, category, location, search } = req.query;

  if (search !== undefined && typeof search !== "string") {
    details.push("El parámetro search debe ser texto");
  }

  if (
    status !== undefined &&
    status !== "all" &&
    !ALLOWED_STATUSES.includes(status)
  ) {
    details.push(
      `El parámetro de filtro status debe ser uno de: ${ALLOWED_STATUSES.join(", ")}`
    );
  }

  if (
    priority !== undefined &&
    priority !== "all" &&
    !ALLOWED_PRIORITIES.includes(priority)
  ) {
    details.push(
      `El parámetro de filtro priority debe ser uno de: ${ALLOWED_PRIORITIES.join(", ")}`
    );
  }

  if (
    category !== undefined &&
    category !== "all" &&
    !isValidObjectIdString(category)
  ) {
    details.push("El parámetro de filtro category debe ser un ObjectId válido");
  }

  if (
    location !== undefined &&
    location !== "all" &&
    !isValidObjectIdString(location)
  ) {
    details.push("El parámetro de filtro location debe ser un ObjectId válido");
  }

  if (details.length > 0) {
    return next(
      new AppError(
        400,
        "Parámetros de consulta de solicitudes inválidos",
        details
      )
    );
  }

  next();
}

// POST /api/service-requests
const validateServiceRequestPayload = buildValidator(
  false,
  "Datos de la solicitud de servicio inválidos"
);

// PATCH /api/service-requests/:id
const validateServiceRequestUpdatePayload = buildValidator(
  true,
  "Datos de actualización de la solicitud inválidos"
);

module.exports = {
  validateServiceRequestPayload,
  validateServiceRequestUpdatePayload,
  validateServiceRequestQuery,
  ALLOWED_PRIORITIES,
  ALLOWED_STATUSES,
};
