"use strict";

const mongoose = require("mongoose");
const ZoneModel = require("../models/zone.model");
const AppError = require("../utils/appError");

function sanitize(payload) {
  const data = {};

  if (payload.name !== undefined) {
    data.name = payload.name.trim();
  }

  if (payload.description !== undefined) {
    const trimmedDesc = payload.description.trim();
    data.description = trimmedDesc || "Zona de cobertura operativa";
  }

  if (payload.color !== undefined) {
    data.color = payload.color.trim().toLowerCase();
  }

  if (payload.coordinates !== undefined) {
    data.area = {
      type: "Polygon",
      coordinates: payload.coordinates,
    };
  }

  return data;
}

class ZonesService {
  async find() {
    const zones = await ZoneModel.find()
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return zones.map((zone) => zone.toJSON());
  }

  async findOne(id) {
    const zone = await ZoneModel.findById(id).populate(
      "createdBy",
      "name email role"
    );

    if (!zone) {
      throw new AppError(404, "Zona no encontrada", [
        `No existe una zona con el id ${id}`,
      ]);
    }

    return zone;
  }

  async getGeoJSON() {
    const zones = await this.find();

    return {
      type: "FeatureCollection",
      features: zones.map((zone) => ({
        type: "Feature",
        properties: {
          id: zone.id,
          name: zone.name,
          description: zone.description,
          color: zone.color,
          createdBy: zone.createdBy,
          createdAt: zone.createdAt,
          updatedAt: zone.updatedAt,
        },
        geometry: zone.area,
      })),
    };
  }

  async create(payload, userId) {
    const data = sanitize(payload);
    data.createdBy = userId;

    const created = await ZoneModel.create(data);
    const populated = await this.findOne(created._id);

    return populated.toJSON();
  }

  async update(id, changes) {
    const zone = await this.findOne(id);
    const data = sanitize(changes);

    zone.set(data);
    await zone.save();

    const populated = await this.findOne(zone._id);
    return populated.toJSON();
  }

  // Elimina la zona y desvincula referencias en la colección "professionals" ({ zone: null })
  async delete(id) {
    const zone = await this.findOne(id);

    const db = mongoose.connection.db;
    if (db) {
      const zoneObjectId = new mongoose.Types.ObjectId(String(zone._id));
      await db
        .collection("professionals")
        .updateMany({ zone: zoneObjectId }, { $set: { zone: null } });
    }

    await zone.deleteOne();
    return zone.toJSON();
  }
}

module.exports = ZonesService;
