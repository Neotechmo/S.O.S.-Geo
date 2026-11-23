"use strict";

const mongoose = require("mongoose");
const ProfessionalModel = require("../models/professional.model");
const CategoryModel = require("../models/category.model");
const ZoneModel = require("../models/zone.model");
const AppError = require("../utils/appError");

const CATEGORY_POPULATE_FIELDS = "name color icon description isActive";
const ZONE_POPULATE_FIELDS = "name color description";

function sanitize(payload) {
  const data = {};

  ["fullName", "specialty", "phone"].forEach((field) => {
    if (payload[field] !== undefined) {
      data[field] = payload[field].trim();
    }
  });

  if (payload.email !== undefined) {
    data.email = payload.email.trim().toLowerCase();
  }

  if (payload.experienceYears !== undefined) {
    data.experienceYears = Number(payload.experienceYears);
  }

  if (payload.status !== undefined) {
    data.status = payload.status.trim();
  }

  if (payload.category !== undefined) {
    data.category = payload.category.trim();
  }

  if (payload.zone !== undefined) {
    data.zone =
      payload.zone === null || payload.zone === ""
        ? null
        : payload.zone.trim();
  }

  return data;
}

class ProfessionalsService {
  async find(filters = {}) {
    const query = {};

    if (filters.category && filters.category !== "all") {
      query.category = filters.category;
    }

    if (filters.status && filters.status !== "all") {
      query.status = filters.status;
    }

    if (filters.zone && filters.zone !== "all") {
      query.zone = filters.zone;
    }

    const professionals = await ProfessionalModel.find(query)
      .populate("category", CATEGORY_POPULATE_FIELDS)
      .populate("zone", ZONE_POPULATE_FIELDS)
      .sort({ fullName: 1 });

    return professionals.map((pro) => pro.toJSON());
  }

  async findOne(id) {
    const professional = await ProfessionalModel.findById(id)
      .populate("category", CATEGORY_POPULATE_FIELDS)
      .populate("zone", ZONE_POPULATE_FIELDS);

    if (!professional) {
      throw new AppError(404, "Profesional no encontrado", [
        `No existe un profesional con el id ${id}`,
      ]);
    }

    return professional;
  }

  // Verifica que el correo no esté registrado por otro profesional
  async ensureUniqueEmail(email, excludeId = null) {
    const filter = { email: email.toLowerCase() };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existing = await ProfessionalModel.findOne(filter);
    if (existing) {
      throw new AppError(400, "El correo del profesional ya está en uso", [
        `Ya existe un profesional registrado con el correo "${email}"`,
      ]);
    }
  }

  // Verifica que los ObjectId de category y zone existan realmente en MongoDB
  async ensureReferencesExist({ categoryId, zoneId }) {
    const details = [];

    if (categoryId !== undefined) {
      const categoryExists = await CategoryModel.exists({ _id: categoryId });
      if (!categoryExists) {
        details.push(`No existe la categoría con id ${categoryId}`);
      }
    }

    if (zoneId !== undefined && zoneId !== null) {
      const zoneExists = await ZoneModel.exists({ _id: zoneId });
      if (!zoneExists) {
        details.push(`No existe la zona con id ${zoneId}`);
      }
    }

    if (details.length > 0) {
      throw new AppError(
        400,
        "Referencias ObjectId inválidas en el profesional",
        details
      );
    }
  }

  async create(payload) {
    const data = sanitize(payload);

    await this.ensureUniqueEmail(data.email);
    await this.ensureReferencesExist({
      categoryId: data.category,
      zoneId: data.zone,
    });

    const created = await ProfessionalModel.create(data);
    const populated = await this.findOne(created._id);

    return populated.toJSON();
  }

  async update(id, changes) {
    const professional = await this.findOne(id);
    const data = sanitize(changes);

    if (data.email !== undefined) {
      await this.ensureUniqueEmail(data.email, professional._id);
    }

    await this.ensureReferencesExist({
      categoryId: data.category,
      zoneId: data.zone,
    });

    professional.set(data);
    await professional.save();

    const populated = await this.findOne(professional._id);
    return populated.toJSON();
  }

  // Elimina el profesional y limpia sus referencias opcionales en ubicaciones y solicitudes
  async delete(id) {
    const professional = await this.findOne(id);

    const db = mongoose.connection.db;
    if (db) {
      const proObjectId = new mongoose.Types.ObjectId(String(professional._id));
      await Promise.all([
        db
          .collection("locations")
          .updateMany(
            { primaryProfessional: proObjectId },
            { $set: { primaryProfessional: null } }
          ),
        db
          .collection("servicerequests")
          .updateMany(
            { professional: proObjectId },
            { $set: { professional: null } }
          ),
      ]);
    }

    await professional.deleteOne();
    return professional.toJSON();
  }
}

module.exports = ProfessionalsService;
