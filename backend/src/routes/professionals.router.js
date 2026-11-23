"use strict";

const express = require("express");
const ProfessionalsService = require("../services/professionals.service");
const { requireAuth } = require("../middlewares/auth.handler");
const { validateObjectId } = require("../middlewares/objectId.validator");
const {
  validateProfessionalPayload,
  validateProfessionalUpdatePayload,
  validateProfessionalQuery,
} = require("../middlewares/professional.validator");

const router = express.Router();
const service = new ProfessionalsService();

// Todas las rutas de profesionales requieren JWT
router.use(requireAuth);

// GET /api/professionals?category=&status=&zone=
router.get("/", validateProfessionalQuery, async (req, res, next) => {
  try {
    const professionals = await service.find({
      category: req.query.category,
      status: req.query.status,
      zone: req.query.zone,
    });

    res.status(200).json({
      count: professionals.length,
      data: professionals,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/professionals/:id
router.get("/:id", validateObjectId("id"), async (req, res, next) => {
  try {
    const professional = await service.findOne(req.params.id);
    res.status(200).json({
      data: professional.toJSON(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/professionals
router.post("/", validateProfessionalPayload, async (req, res, next) => {
  try {
    const professional = await service.create(req.body);
    res.status(201).json({
      message: "Profesional creado correctamente",
      data: professional,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/professionals/:id
router.patch(
  "/:id",
  validateObjectId("id"),
  validateProfessionalUpdatePayload,
  async (req, res, next) => {
    try {
      const professional = await service.update(req.params.id, req.body);
      res.status(200).json({
        message: "Profesional actualizado correctamente",
        data: professional,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/professionals/:id
router.delete("/:id", validateObjectId("id"), async (req, res, next) => {
  try {
    const professional = await service.delete(req.params.id);
    res.status(200).json({
      message: "Profesional eliminado correctamente",
      data: professional,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
