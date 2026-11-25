"use strict";

// Usuario de prueba para el evaluador (Entregable #2 de la rúbrica).
// La contraseña se cifra con bcrypt en el hook pre("save") del modelo User,
// por eso seed.js lo inserta con UserModel.create() y no con insertMany().
const DEMO_USER = {
  key: "demo",
  name: "Usuario Prueba Evaluador",
  email: "demo@sosgeo.lasalle.mx",
  password: "Password123!",
  role: "admin",
};

const users = [DEMO_USER];

module.exports = users;
module.exports.DEMO_USER = DEMO_USER;
