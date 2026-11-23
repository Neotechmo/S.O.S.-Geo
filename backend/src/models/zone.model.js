"use strict";

const mongoose = require("mongoose");

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre de la zona es obligatorio"],
      trim: true,
      minLength: [3, "El nombre de la zona debe tener al menos 3 caracteres"],
      maxLength: [80, "El nombre de la zona no puede superar los 80 caracteres"],
    },
    description: {
      type: String,
      trim: true,
      maxLength: [200, "La descripción no puede superar los 200 caracteres"],
      default: "Zona de cobertura operativa",
    },
    color: {
      type: String,
      trim: true,
      default: "#1570ef",
      match: [
        HEX_COLOR_REGEX,
        "El color debe tener el formato hexadecimal #RRGGBB",
      ],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario creador es obligatorio"],
    },
    // Polígono en formato GeoJSON: cada vértice siempre en orden [longitud, latitud]
    area: {
      type: {
        type: String,
        enum: ["Polygon"],
        default: "Polygon",
        required: true,
      },
      coordinates: {
        type: [[[Number]]],
        required: [true, "Las coordenadas del polígono son obligatorias"],
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

// Índice geoespacial obligatorio por rúbrica para consultas sobre GeoJSON Polygon
zoneSchema.index({ area: "2dsphere" });
zoneSchema.index({ name: 1 });

const ZoneModel = mongoose.model("Zone", zoneSchema);

module.exports = ZoneModel;
module.exports.HEX_COLOR_REGEX = HEX_COLOR_REGEX;
