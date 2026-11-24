"use strict";

const mongoose = require("mongoose");

const ALLOWED_STATUSES = ["activo", "en_servicio", "inactivo"];
const PHONE_REGEX = /^[0-9+\-\s]{10,15}$/;

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      minLength: [4, "El nombre debe tener al menos 4 caracteres"],
      maxLength: [80, "El nombre no puede superar los 80 caracteres"],
    },
    description: {
      type: String,
      required: [true, "La descripción es obligatoria"],
      trim: true,
      minLength: [10, "La descripción debe tener al menos 10 caracteres"],
      maxLength: [250, "La descripción no puede superar los 250 caracteres"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "La categoría es obligatoria"],
    },
    status: {
      type: String,
      required: [true, "El estado es obligatorio"],
      enum: {
        values: ALLOWED_STATUSES,
        message: "El estado debe ser: activo, en_servicio o inactivo",
      },
      default: "activo",
    },
    contactPhone: {
      type: String,
      trim: true,
      maxLength: [15, "El teléfono de contacto no puede superar los 15 caracteres"],
      default: "",
    },
    primaryProfessional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professional",
      default: null,
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario que registra la ubicación es obligatorio"],
    },
    // Punto GeoJSON: coordenadas siempre en orden [longitud, latitud]
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number],
        required: [true, "Las coordenadas del punto son obligatorias"],
        validate: {
          validator(value) {
            return (
              Array.isArray(value) &&
              value.length === 2 &&
              value[0] >= -180 &&
              value[0] <= 180 &&
              value[1] >= -90 &&
              value[1] <= 90
            );
          },
          message:
            "Las coordenadas deben ser [longitud, latitud] con longitud entre -180 y 180 y latitud entre -90 y 90",
        },
      },
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

// Índice geoespacial obligatorio por rúbrica para consultas sobre GeoJSON Point
locationSchema.index({ location: "2dsphere" });
locationSchema.index({ category: 1, status: 1 });

const LocationModel = mongoose.model("Location", locationSchema);

module.exports = LocationModel;
module.exports.ALLOWED_STATUSES = ALLOWED_STATUSES;
module.exports.PHONE_REGEX = PHONE_REGEX;
