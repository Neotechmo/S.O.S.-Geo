"use strict";

const mongoose = require("mongoose");
const ServiceRequestModel = require("../models/service-request.model");
const CategoryModel = require("../models/category.model");
const LocationModel = require("../models/location.model");
const ProfessionalModel = require("../models/professional.model");
const AppError = require("../utils/appError");

const POPULATE = [
  { path: "category", select: "name color icon" },
  { path: "location", select: "name status location" },
  { path: "professional", select: "fullName specialty phone status" },
  { path: "requestedBy", select: "name email role" },
];

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function generateFolio() {
  const year = new Date().getFullYear();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const timePart = String(Date.now()).slice(-4);
  return `SOS-${year}-${timePart}${suffix}`;
}

function sanitize(payload) {
  const data = {};

  [
    "title",
    "description",
    "priority",
    "status",
    "contactName",
    "contactPhone",
    "category",
    "location",
  ].forEach((field) => {
    if (payload[field] !== undefined) {
      data[field] = payload[field].trim();
    }
  });

  if (payload.professional !== undefined) {
    data.professional =
      payload.professional === null || payload.professional === ""
        ? null
        : payload.professional.trim();
  }

  return data;
}

function buildQuery({ status, priority, category, location, search } = {}) {
  const query = {};

  if (status && status !== "all") {
    query.status = status;
  }

  if (priority && priority !== "all") {
    query.priority = priority;
  }

  if (category && category !== "all") {
    query.category = new mongoose.Types.ObjectId(String(category));
  }

  if (location && location !== "all") {
    query.location = new mongoose.Types.ObjectId(String(location));
  }

  if (typeof search === "string" && search.trim() !== "") {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    query.$or = [
      { folio: regex },
      { title: regex },
      { description: regex },
      { contactName: regex },
    ];
  }

  return query;
}

class ServiceRequestsService {
  async find(filters = {}) {
    const requests = await ServiceRequestModel.find(buildQuery(filters))
      .populate(POPULATE)
      .sort({ createdAt: -1 });

    return requests.map((request) => request.toJSON());
  }

  async findOne(id) {
    const request = await ServiceRequestModel.findById(id).populate(POPULATE);

    if (!request) {
      throw new AppError(404, "Solicitud de servicio no encontrada", [
        `No existe una solicitud con el id ${id}`,
      ]);
    }

    return request;
  }

  // Verifica que category, location y professional (si se envía) existan en MongoDB
  async ensureReferencesExist({ categoryId, locationId, professionalId }) {
    const details = [];

    if (categoryId !== undefined) {
      const categoryExists = await CategoryModel.exists({ _id: categoryId });
      if (!categoryExists) {
        details.push(`No existe la categoría con id ${categoryId}`);
      }
    }

    if (locationId !== undefined) {
      const locationExists = await LocationModel.exists({ _id: locationId });
      if (!locationExists) {
        details.push(`No existe la ubicación con id ${locationId}`);
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
        "Referencias ObjectId inválidas en la solicitud de servicio",
        details
      );
    }
  }

  async create(payload, userId) {
    const data = sanitize(payload);
    data.folio = generateFolio();
    data.requestedBy = userId;

    await this.ensureReferencesExist({
      categoryId: data.category,
      locationId: data.location,
      professionalId: data.professional,
    });

    const created = await ServiceRequestModel.create(data);
    const populated = await this.findOne(created._id);

    return populated.toJSON();
  }

  async update(id, changes) {
    const request = await this.findOne(id);
    const data = sanitize(changes);

    await this.ensureReferencesExist({
      categoryId: data.category,
      locationId: data.location,
      professionalId: data.professional,
    });

    request.set(data);
    await request.save();

    const populated = await this.findOne(request._id);
    return populated.toJSON();
  }

  async delete(id) {
    const request = await this.findOne(id);
    await request.deleteOne();
    return request.toJSON();
  }
}

module.exports = ServiceRequestsService;
