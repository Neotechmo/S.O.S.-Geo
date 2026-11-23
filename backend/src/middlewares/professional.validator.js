"use strict";

const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const {
  ALLOWED_STATUSES,
  PHONE_REGEX,
  EMAIL_REGEX,
} = require("../models/professional.model");

const ALLOWED_FIELDS = [
  "fullName",
  "specialty",
  "phone",
  "email",
  "experienceYears",
  "status",
  "category",
  "zone",
];

const REQUIRED_ON_CREATE = [
  "fullName",
  "specialty",
  "phone",
  "email",
  "experienceYears",
  "category",
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

  if (body.fullName !== undefined) {
    validateTextField(body.fullName, "El nombre completo", 4, 90, details);
  }

  if (body.specialty !== undefined) {
    validateTextField(body.specialty, "La especialidad", 4, 100, details);
  }

  if (body.phone !== undefined) {
    if (
      typeof body.phone !== "string" ||
      !PHONE_REGEX.test(body.phone.trim())
    ) {
      details.push(
        "El teléfono debe tener entre 10 y 15 caracteres válidos (dígitos, +, - o espacios)"
      );
    }
  }

  if (body.email !== undefined) {
    if (
      typeof body.email !== "string" ||
      !EMAIL_REGEX.test(body.email.trim())
    ) {
      details.push("El correo electrónico no tiene un formato válido");
    }
  }

  if (body.experienceYears !== undefined) {
    const rawExp = body.experienceYears;
    const years =
      typeof rawExp === "boolean" || rawExp === null || rawExp === ""
        ? NaN
        : Number(rawExp);

    if (!Number.isFinite(years) || !Number.isInteger(years)) {
      details.push("Los años de experiencia deben ser un número entero");
    } else if (years < 0 || years > 60) {
      details.push("Los años de experiencia deben estar entre 0 y 60");
    } else {
      body.experienceYears = years;
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

  if (body.category !== undefined) {
    if (!isValidObjectIdString(body.category)) {
      details.push("El campo category debe ser un ObjectId de MongoDB válido");
    }
  }

  if (body.zone !== undefined && body.zone !== null && body.zone !== "") {
    if (!isValidObjectIdString(body.zone)) {
      details.push(
        "El campo zone debe ser un ObjectId de MongoDB válido o null"
      );
    }
  }

  return details;
}

function buildValidator(partial, message) {
  return function validateProfessional(req, res, next) {
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

function validateProfessionalQuery(req, res, next) {
  const details = [];
  const { category, status, zone } = req.query;

  if (
    category !== undefined &&
    category !== "all" &&
    !isValidObjectIdString(category)
  ) {
    details.push(
      "El parámetro de filtro category debe ser un ObjectId válido"
    );
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

  if (zone !== undefined && zone !== "all" && !isValidObjectIdString(zone)) {
    details.push("El parámetro de filtro zone debe ser un ObjectId válido");
  }

  if (details.length > 0) {
    return next(
      new AppError(400, "Parámetros de consulta de profesionales inválidos", details)
    );
  }

  next();
}

// POST /api/professionals
const validateProfessionalPayload = buildValidator(
  false,
  "Datos del profesional inválidos"
);

// PATCH /api/professionals/:id
const validateProfessionalUpdatePayload = buildValidator(
  true,
  "Datos de actualización del profesional inválidos"
);

module.exports = {
  validateProfessionalPayload,
  validateProfessionalUpdatePayload,
  validateProfessionalQuery,
  ALLOWED_STATUSES,
};
