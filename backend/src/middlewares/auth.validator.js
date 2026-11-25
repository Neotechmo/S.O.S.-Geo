"use strict";

const AppError = require("../utils/appError");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// Valida el body de POST /api/auth/register: { name, email, password }
function validateRegisterPayload(req, res, next) {
  const { name, email, password } = req.body || {};
  const details = [];

  if (!isNonEmptyString(name)) {
    details.push("El nombre es obligatorio");
  } else if (name.trim().length < 3 || name.trim().length > 80) {
    details.push("El nombre debe tener entre 3 y 80 caracteres");
  }

  if (!isNonEmptyString(email)) {
    details.push("El correo es obligatorio");
  } else if (!EMAIL_REGEX.test(email.trim())) {
    details.push("El correo no tiene un formato válido");
  }

  if (typeof password !== "string" || password.length === 0) {
    details.push("La contraseña es obligatoria");
  } else if (password.length < 8) {
    details.push("La contraseña debe tener al menos 8 caracteres");
  }

  if (details.length > 0) {
    return next(new AppError(400, "Datos de registro inválidos", details));
  }

  next();
}

// Valida el body de POST /api/auth/login: { email, password }
function validateLoginPayload(req, res, next) {
  const { email, password } = req.body || {};
  const details = [];

  if (!isNonEmptyString(email)) {
    details.push("El correo es obligatorio");
  } else if (!EMAIL_REGEX.test(email.trim())) {
    details.push("El correo no tiene un formato válido");
  }

  if (typeof password !== "string" || password.length === 0) {
    details.push("La contraseña es obligatoria");
  }

  if (details.length > 0) {
    return next(new AppError(400, "Datos de inicio de sesión inválidos", details));
  }

  next();
}

module.exports = {
  validateRegisterPayload,
  validateLoginPayload,
};
