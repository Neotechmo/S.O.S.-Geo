"use strict";

const express = require("express");
const ZonesService = require("../services/zones.service");
const { requireAuth } = require("../middlewares/auth.handler");
const { validateObjectId } = require("../middlewares/objectId.validator");
const {
  validateZonePayload,
  validateZoneUpdatePayload,
} = require("../middlewares/zone.validator");

const router = express.Router();
const service = new ZonesService();

// Todas las rutas de zonas requieren JWT
router.use(requireAuth);

// GET /api/zones
router.get("/", async (req, res, next) => {
  try {
    const zones = await service.find();
    res.status(200).json({
      count: zones.length,
      data: zones,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/zones/geojson
router.get("/geojson", async (req, res, next) => {
  try {
    const featureCollection = await service.getGeoJSON();
    res.status(200).json(featureCollection);
  } catch (error) {
    next(error);
  }
});

// GET /api/zones/:id
router.get("/:id", validateObjectId("id"), async (req, res, next) => {
  try {
    const zone = await service.findOne(req.params.id);
    res.status(200).json({
      data: zone.toJSON(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/zones
router.post("/", validateZonePayload, async (req, res, next) => {
  try {
    const zone = await service.create(req.body, req.user.id);
    res.status(201).json({
      message: "Zona creada correctamente",
      data: zone,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/zones/:id
router.patch(
  "/:id",
  validateObjectId("id"),
  validateZoneUpdatePayload,
  async (req, res, next) => {
    try {
      const zone = await service.update(req.params.id, req.body);
      res.status(200).json({
        message: "Zona actualizada correctamente",
        data: zone,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/zones/:id
router.delete("/:id", validateObjectId("id"), async (req, res, next) => {
  try {
    const zone = await service.delete(req.params.id);
    res.status(200).json({
      message: "Zona eliminada correctamente",
      data: zone,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
