"use strict";

const AppError = require("../utils/appError");
const { HEX_COLOR_REGEX } = require("../models/category.model");

const ALLOWED_FIELDS = ["name", "description", "color", "icon", "isActive"];
const REQUIRED_ON_CREATE = ["name", "description", "color", "icon"];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateTextField(value, label, min, max, details) {
  if (!isNonEmptyString(value)) {
    details.push(`${label} es obligatorio y debe ser texto`);
    return;
  }

  const length = value.trim().length;
  if (min && length < min) {
    details.push(`${label} debe tener al menos ${min} caracteres`);
  } else if (length > max) {
    details.push(`${label} no puede superar los ${max} caracteres`);
  }
}

// Revisa cada campo presente en el body; en creación además exige los obligatorios
function collectErrors(body, { partial }) {
  const details = [];

  const unknownFields = Object.keys(body).filter(
    (field) => !ALLOWED_FIELDS.includes(field)
  );
  if (unknownFields.length > 0) {
    details.push(`Campos no permitidos: ${unknownFields.join(", ")}`);
  }

  if (!partial) {
    REQUIRED_ON_CREATE.forEach((field) => {
      if (body[field] === undefined) {
        details.push(`El campo ${field} es obligatorio`);
      }
    });
  } else if (Object.keys(body).length === 0) {
    details.push("Debes enviar al menos un campo para actualizar");
  }

  if (body.name !== undefined) {
    validateTextField(body.name, "El nombre", 3, 60, details);
  }

  if (body.description !== undefined) {
    validateTextField(body.description, "La descripción", 10, 200, details);
  }

  if (body.color !== undefined) {
    if (typeof body.color !== "string" || !HEX_COLOR_REGEX.test(body.color.trim())) {
      details.push("El color debe tener el formato hexadecimal #RRGGBB");
    }
  }

  if (body.icon !== undefined) {
    validateTextField(body.icon, "El icono", 0, 30, details);
  }

  if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
    details.push("El campo isActive debe ser booleano (true o false)");
  }

  return details;
}

function buildValidator(partial, message) {
  return function validateCategory(req, res, next) {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return next(new AppError(400, message, ["El cuerpo debe ser un objeto JSON"]));
    }

    const details = collectErrors(body, { partial });
    if (details.length > 0) {
      return next(new AppError(400, message, details));
    }

    next();
  };
}

// POST /api/categories: { name, description, color, icon, isActive? }
const validateCategoryPayload = buildValidator(false, "Datos de categoría inválidos");

// PATCH /api/categories/:id: parcial de { name, description, color, icon, isActive }
const validateCategoryUpdatePayload = buildValidator(
  true,
  "Datos de actualización de categoría inválidos"
);

module.exports = {
  validateCategoryPayload,
  validateCategoryUpdatePayload,
};
