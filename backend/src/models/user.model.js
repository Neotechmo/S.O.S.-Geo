"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Número de rondas de sal para bcrypt (10 es el estándar recomendado)
const SALT_ROUNDS = 10;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const USER_ROLES = ["admin", "operador"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      minLength: [3, "El nombre debe tener al menos 3 caracteres"],
      maxLength: [80, "El nombre no puede superar los 80 caracteres"],
    },
    email: {
      type: String,
      required: [true, "El correo es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, "El correo no tiene un formato válido"],
    },
    password: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
      minLength: [8, "La contraseña debe tener al menos 8 caracteres"],
    },
    role: {
      type: String,
      required: true,
      enum: {
        values: USER_ROLES,
        message: "El rol debe ser 'admin' u 'operador'",
      },
      default: "operador",
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Convierte _id en id y oculta __v y password en todas las respuestas JSON
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Cifra la contraseña con bcrypt antes de guardar (solo si es nueva o cambió),
// así nunca se almacena en texto plano y no se vuelve a cifrar un hash existente
userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// Compara una contraseña en texto plano contra el hash guardado (usado en el login)
userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
module.exports.USER_ROLES = USER_ROLES;
