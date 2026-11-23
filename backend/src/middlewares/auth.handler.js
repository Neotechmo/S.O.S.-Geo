"use strict";

const AppError = require("../utils/appError");
const { verifyToken } = require("../utils/jwt");

// Exige un header "Authorization: Bearer <token>" válido.
// Si el token es correcto, inyecta req.user = { id, email, role }
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(
      new AppError(401, "Se requiere un token de autenticación (Bearer)")
    );
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "El token ha expirado, inicia sesión de nuevo"
        : "Token de autenticación inválido";
    next(new AppError(401, message));
  }
}

module.exports = {
  requireAuth,
};
