"use strict";

const mongoose = require("mongoose");

const ALLOWED_PRIORITIES = ["baja", "media", "alta", "critica"];
const ALLOWED_STATUSES = ["pendiente", "en_proceso", "atendida", "cancelada"];
const PHONE_REGEX = /^[0-9+\-\s]{10,15}$/;

const serviceRequestSchema = new mongoose.Schema(
  {
    folio: {
      type: String,
      required: [true, "El folio es obligatorio"],
      trim: true,
      maxLength: [30, "El folio no puede superar los 30 caracteres"],
    },
    title: {
      type: String,
      required: [true, "El título es obligatorio"],
      trim: true,
      minLength: [4, "El título debe tener al menos 4 caracteres"],
      maxLength: [90, "El título no puede superar los 90 caracteres"],
    },
    description: {
      type: String,
      required: [true, "La descripción es obligatoria"],
      trim: true,
      minLength: [10, "La descripción debe tener al menos 10 caracteres"],
      maxLength: [300, "La descripción no puede superar los 300 caracteres"],
    },
    priority: {
      type: String,
      required: [true, "La prioridad es obligatoria"],
      enum: {
        values: ALLOWED_PRIORITIES,
        message: "La prioridad debe ser: baja, media, alta o critica",
      },
      default: "media",
    },
    status: {
      type: String,
      required: [true, "El estado es obligatorio"],
      enum: {
        values: ALLOWED_STATUSES,
        message:
          "El estado debe ser: pendiente, en_proceso, atendida o cancelada",
      },
      default: "pendiente",
    },
    contactName: {
      type: String,
      required: [true, "El nombre de contacto es obligatorio"],
      trim: true,
      minLength: [3, "El nombre de contacto debe tener al menos 3 caracteres"],
      maxLength: [
        80,
        "El nombre de contacto no puede superar los 80 caracteres",
      ],
    },
    contactPhone: {
      type: String,
      required: [true, "El teléfono de contacto es obligatorio"],
      trim: true,
      match: [
        PHONE_REGEX,
        "El teléfono de contacto debe tener entre 10 y 15 caracteres válidos (dígitos, +, - o espacios)",
      ],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "La categoría es obligatoria"],
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: [true, "La ubicación es obligatoria"],
    },
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professional",
      default: null,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario solicitante es obligatorio"],
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

serviceRequestSchema.index({ folio: 1 }, { unique: true });
serviceRequestSchema.index({ status: 1, priority: 1 });
serviceRequestSchema.index({ category: 1 });
serviceRequestSchema.index({ location: 1 });

const ServiceRequestModel = mongoose.model(
  "ServiceRequest",
  serviceRequestSchema
);

module.exports = ServiceRequestModel;
module.exports.ALLOWED_PRIORITIES = ALLOWED_PRIORITIES;
module.exports.ALLOWED_STATUSES = ALLOWED_STATUSES;
module.exports.PHONE_REGEX = PHONE_REGEX;
