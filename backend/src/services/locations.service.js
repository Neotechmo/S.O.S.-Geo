"use strict";

const mongoose = require("mongoose");
const LocationModel = require("../models/location.model");
const CategoryModel = require("../models/category.model");
const ProfessionalModel = require("../models/professional.model");
const AppError = require("../utils/appError");

const POPULATE = [
  { path: "category", select: "name color icon" },
  { path: "primaryProfessional", select: "fullName specialty phone status" },
  { path: "registeredBy", select: "name email" },
];

// Escapa caracteres especiales para usar el texto del usuario dentro de un RegExp
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitize(payload) {
  const data = {};

  ["name", "description", "status", "contactPhone", "category"].forEach((field) => {
    if (payload[field] !== undefined) {
      data[field] = payload[field].trim();
    }
  });

  if (payload.primaryProfessional !== undefined) {
    data.primaryProfessional =
      payload.primaryProfessional === null || payload.primaryProfessional === ""
        ? null
        : payload.primaryProfessional.trim();
  }

  // GeoJSON exige el orden [longitud, latitud]
  if (payload.latitude !== undefined && payload.longitude !== undefined) {
    data.location = {
      type: "Point",
      coordinates: [Number(payload.longitude), Number(payload.latitude)],
    };
  }

  return data;
}

// Construye el filtro de MongoDB a partir de ?search=&category=&status=
function buildQuery({ search, category, status } = {}) {
  const query = {};

  if (typeof search === "string" && search.trim() !== "") {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    query.$or = [{ name: regex }, { description: regex }];
  }

  if (category && category !== "all") {
    query.category = new mongoose.Types.ObjectId(String(category));
  }

  if (status && status !== "all") {
    query.status = status;
  }

  return query;
}

class LocationsService {
  async find(filters = {}) {
    const locations = await LocationModel.find(buildQuery(filters))
      .populate(POPULATE)
      .sort({ createdAt: -1 });

    return locations.map((location) => location.toJSON());
  }

  async findOne(id) {
    const location = await LocationModel.findById(id).populate(POPULATE);

    if (!location) {
      throw new AppError(404, "Ubicación no encontrada", [
        `No existe una ubicación con el id ${id}`,
      ]);
    }

    return location;
  }

  async getGeoJSON(filters = {}) {
    const locations = await this.find(filters);

    return {
      type: "FeatureCollection",
      features: locations.map(({ location, ...properties }) => ({
        type: "Feature",
        properties,
        geometry: location,
      })),
    };
  }

  // Verifica que los ObjectId de category y primaryProfessional existan en MongoDB
  async ensureReferencesExist({ categoryId, professionalId }) {
    const details = [];

    if (categoryId !== undefined) {
      const categoryExists = await CategoryModel.exists({ _id: categoryId });
      if (!categoryExists) {
        details.push(`No existe la categoría con id ${categoryId}`);
      }
    }

    if (professionalId !== undefined && professionalId !== null) {
      const professionalExists = await ProfessionalModel.exists({
        _id: professionalId,
      });
      if (!professionalExists) {
        details.push(`No existe el profesional con id ${professionalId}`);
      }
    }

    if (details.length > 0) {
      throw new AppError(
        400,
        "Referencias ObjectId inválidas en la ubicación",
        details
      );
    }
  }

  async create(payload, userId) {
    const data = sanitize(payload);
    data.registeredBy = userId;

    await this.ensureReferencesExist({
      categoryId: data.category,
      professionalId: data.primaryProfessional,
    });

    const created = await LocationModel.create(data);
    const populated = await this.findOne(created._id);

    return populated.toJSON();
  }

  async update(id, changes) {
    const location = await this.findOne(id);
    const data = sanitize(changes);

    await this.ensureReferencesExist({
      categoryId: data.category,
      professionalId: data.primaryProfessional,
    });

    location.set(data);
    await location.save();

    const populated = await this.findOne(location._id);
    return populated.toJSON();
  }

  // Elimina la ubicación y en cascada las solicitudes de servicio vinculadas a ella
  async delete(id) {
    const location = await this.findOne(id);

    const db = mongoose.connection.db;
    if (db) {
      const locationObjectId = new mongoose.Types.ObjectId(String(location._id));
      await db
        .collection("servicerequests")
        .deleteMany({ location: locationObjectId });
    }

    await location.deleteOne();
    return location.toJSON();
  }
}

module.exports = LocationsService;
