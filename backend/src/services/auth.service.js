"use strict";

const UserModel = require("../models/user.model");
const AppError = require("../utils/appError");
const { signToken } = require("../utils/jwt");

class AuthService {
  // Crea un usuario nuevo (el rol siempre es "operador"; no se acepta desde el body)
  async register({ name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError(400, "El correo ya está registrado", [
        `Ya existe una cuenta con el correo ${normalizedEmail}`,
      ]);
    }

    // La contraseña se cifra con bcrypt en el hook pre("save") del modelo
    const user = await UserModel.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    return {
      token: signToken(user),
      user: user.toJSON(),
    };
  }

  // Verifica credenciales y devuelve un token JWT
  async login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail });

    // Mismo mensaje para correo inexistente y contraseña incorrecta
    // para no revelar qué correos están registrados
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError(401, "Correo o contraseña incorrectos");
    }

    return {
      token: signToken(user),
      user: user.toJSON(),
    };
  }

  // Devuelve el perfil del usuario autenticado (sin password)
  async getProfile(userId) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new AppError(401, "El usuario del token ya no existe");
    }

    return user.toJSON();
  }
}

module.exports = AuthService;
