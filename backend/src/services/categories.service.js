"use strict";

const mongoose = require("mongoose");
const CategoryModel = require("../models/category.model");
const AppError = require("../utils/appError");

const { NAME_COLLATION } = CategoryModel;

// Colecciones que guardan una referencia { category: ObjectId }.
// Se consultan por nombre de colección para que la verificación funcione
// aunque los modelos Location, Professional y ServiceRequest aún no existan.
const REFERENCING_COLLECTIONS = [
  { collection: "locations", label: "ubicaciones" },
  { collection: "professionals", label: "profesionales" },
  { collection: "servicerequests", label: "solicitudes de servicio" },
];

// Normaliza los campos de texto antes de guardarlos
function sanitize(payload) {
  const data = {};

  ["name", "description", "color", "icon"].forEach((field) => {
    if (payload[field] !== undefined) {
      data[field] = payload[field].trim();
    }
  });

  if (data.color) {
    data.color = data.color.toLowerCase();
  }

  if (payload.isActive !== undefined) {
    data.isActive = payload.isActive;
  }

  return data;
}

class CategoriesService {
  async find() {
    const categories = await CategoryModel.find().sort({ name: 1 }).collation(NAME_COLLATION);
    return categories.map((category) => category.toJSON());
  }

  async findOne(id) {
    const category = await CategoryModel.findById(id);

    if (!category) {
      throw new AppError(404, "Categoría no encontrada", [
        `No existe una categoría con el id ${id}`,
      ]);
    }

    return category;
  }

  // Lanza 400 si ya existe otra categoría con el mismo nombre (sin importar mayúsculas/acentos)
  async ensureUniqueName(name, excludeId = null) {
    const filter = { name };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existing = await CategoryModel.findOne(filter).collation(NAME_COLLATION);
    if (existing) {
      throw new AppError(400, "El nombre de la categoría ya está en uso", [
        `Ya existe la categoría "${existing.name}"`,
      ]);
    }
  }

  async create(payload) {
    const data = sanitize(payload);
    await this.ensureUniqueName(data.name);

    const category = await CategoryModel.create(data);
    return category.toJSON();
  }

  async update(id, changes) {
    const category = await this.findOne(id);
    const data = sanitize(changes);

    if (data.name !== undefined) {
      await this.ensureUniqueName(data.name, category._id);
    }

    category.set(data);
    await category.save();

    return category.toJSON();
  }

  // Cuenta cuántos documentos de otras colecciones apuntan a esta categoría
  async countReferences(id) {
    const db = mongoose.connection.db;
    const categoryId = new mongoose.Types.ObjectId(String(id));

    const counts = await Promise.all(
      REFERENCING_COLLECTIONS.map(async ({ collection, label }) => ({
        label,
        count: await db.collection(collection).countDocuments({ category: categoryId }),
      }))
    );

    return counts.filter(({ count }) => count > 0);
  }

  // Elimina la categoría solo si no está referenciada (evita referencias huérfanas)
  async delete(id) {
    const category = await this.findOne(id);
    const references = await this.countReferences(category._id);

    if (references.length > 0) {
      throw new AppError(
        400,
        "No se puede eliminar la categoría porque tiene registros asociados",
        references.map(({ label, count }) => `${count} ${label} usan esta categoría`)
      );
    }

    await category.deleteOne();
    return category.toJSON();
  }
}

module.exports = CategoriesService;
