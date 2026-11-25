"use strict";

const mongoose = require("mongoose");

const ALLOWED_STATUSES = ["disponible", "en_servicio", "inactivo"];
const PHONE_REGEX = /^[0-9+\-\s]{10,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const professionalSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "El nombre completo es obligatorio"],
      trim: true,
      minLength: [4, "El nombre completo debe tener al menos 4 caracteres"],
      maxLength: [90, "El nombre completo no puede superar los 90 caracteres"],
    },
    specialty: {
      type: String,
      required: [true, "La especialidad es obligatoria"],
      trim: true,
      minLength: [4, "La especialidad debe tener al menos 4 caracteres"],
      maxLength: [100, "La especialidad no puede superar los 100 caracteres"],
    },
    phone: {
      type: String,
      required: [true, "El teléfono es obligatorio"],
      trim: true,
      match: [
        PHONE_REGEX,
        "El teléfono debe tener entre 10 y 15 caracteres (dígitos, +, - o espacios)",
      ],
    },
    email: {
      type: String,
      required: [true, "El correo electrónico es obligatorio"],
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, "El correo electrónico no tiene un formato válido"],
    },
    experienceYears: {
      type: Number,
      required: [true, "Los años de experiencia son obligatorios"],
      min: [0, "Los años de experiencia no pueden ser negativos"],
      max: [60, "Los años de experiencia no pueden superar los 60 años"],
    },
    status: {
      type: String,
      required: [true, "El estado es obligatorio"],
      enum: {
        values: ALLOWED_STATUSES,
        message: "El estado debe ser: disponible, en_servicio o inactivo",
      },
      default: "disponible",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "La categoría es obligatoria"],
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

professionalSchema.index({ email: 1 }, { unique: true });
professionalSchema.index({ category: 1, status: 1 });
professionalSchema.index({ zone: 1 });

const ProfessionalModel = mongoose.model("Professional", professionalSchema);

module.exports = ProfessionalModel;
module.exports.ALLOWED_STATUSES = ALLOWED_STATUSES;
module.exports.PHONE_REGEX = PHONE_REGEX;
module.exports.EMAIL_REGEX = EMAIL_REGEX;
