"use strict";

const mongoose = require("mongoose");

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

// Collation en español con strength 2: ignora mayúsculas/minúsculas y acentos
// al comparar nombres ("Automotriz" y "automotriz" se consideran el mismo)
const NAME_COLLATION = { locale: "es", strength: 2 };

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      // La unicidad se define en el índice con collation de abajo
      trim: true,
      minLength: [3, "El nombre debe tener al menos 3 caracteres"],
      maxLength: [60, "El nombre no puede superar los 60 caracteres"],
    },
    description: {
      type: String,
      required: [true, "La descripción es obligatoria"],
      trim: true,
      minLength: [10, "La descripción debe tener al menos 10 caracteres"],
      maxLength: [200, "La descripción no puede superar los 200 caracteres"],
    },
    color: {
      type: String,
      required: [true, "El color es obligatorio"],
      trim: true,
      match: [HEX_COLOR_REGEX, "El color debe tener el formato hexadecimal #RRGGBB"],
    },
    icon: {
      type: String,
      required: [true, "El icono es obligatorio"],
      trim: true,
      maxLength: [30, "El icono no puede superar los 30 caracteres"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Convierte _id en id y oculta __v en todas las respuestas JSON
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Índice único del nombre sin distinguir mayúsculas ni acentos
categorySchema.index({ name: 1 }, { unique: true, collation: NAME_COLLATION });

const CategoryModel = mongoose.model("Category", categorySchema);

module.exports = CategoryModel;
module.exports.HEX_COLOR_REGEX = HEX_COLOR_REGEX;
module.exports.NAME_COLLATION = NAME_COLLATION;
