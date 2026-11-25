"use strict";

const express = require("express");
const CategoriesService = require("../services/categories.service");
const { requireAuth } = require("../middlewares/auth.handler");
const { validateObjectId } = require("../middlewares/objectId.validator");
const {
  validateCategoryPayload,
  validateCategoryUpdatePayload,
} = require("../middlewares/category.validator");

const router = express.Router();
const service = new CategoriesService();

// Todas las rutas de categorías requieren JWT
router.use(requireAuth);

// GET /api/categories
router.get("/", async (req, res, next) => {
  try {
    const categories = await service.find();
    res.status(200).json({ count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
});

// GET /api/categories/:id
router.get("/:id", validateObjectId("id"), async (req, res, next) => {
  try {
    const category = await service.findOne(req.params.id);
    res.status(200).json({ data: category.toJSON() });
  } catch (error) {
    next(error);
  }
});

// POST /api/categories
router.post("/", validateCategoryPayload, async (req, res, next) => {
  try {
    const category = await service.create(req.body);
    res.status(201).json({
      message: "Categoría creada correctamente",
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/categories/:id
router.patch(
  "/:id",
  validateObjectId("id"),
  validateCategoryUpdatePayload,
  async (req, res, next) => {
    try {
      const category = await service.update(req.params.id, req.body);
      res.status(200).json({
        message: "Categoría actualizada correctamente",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/categories/:id (400 si está en uso)
router.delete("/:id", validateObjectId("id"), async (req, res, next) => {
  try {
    const category = await service.delete(req.params.id);
    res.status(200).json({
      message: "Categoría eliminada correctamente",
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
