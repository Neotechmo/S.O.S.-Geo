"use strict";

const jwt = require("jsonwebtoken");

// Lee el secreto del .env y falla de forma explícita si no está configurado
function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("Falta la variable JWT_SECRET en el archivo .env");
  }

  return secret;
}

// Firma un token JWT con el id, correo y rol del usuario
function signToken(user) {
  const payload = {
    sub: user.id || user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
}

// Verifica la firma y la expiración del token; lanza error si no es válido
function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = {
  signToken,
  verifyToken,
};
