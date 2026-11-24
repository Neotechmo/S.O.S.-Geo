"use strict";

const express = require("express");
const LocationsService = require("../services/locations.service");
const { requireAuth } = require("../middlewares/auth.handler");
const { validateObjectId } = require("../middlewares/objectId.validator");
const {
  validateLocationPayload,
  validateLocationUpdatePayload,
  validateLocationQuery,
} = require("../middlewares/location.validator");

const router = express.Router();
const service = new LocationsService();

// Todas las rutas de ubicaciones requieren JWT
router.use(requireAuth);

function pickFilters(query) {
  return {
    search: query.search,
    category: query.category,
    status: query.status,
  };
}

// GET /api/locations?search=&category=&status=
router.get("/", validateLocationQuery, async (req, res, next) => {
  try {
    const locations = await service.find(pickFilters(req.query));
    res.status(200).json({
      count: locations.length,
      data: locations,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/locations/geojson?search=&category=&status=
router.get("/geojson", validateLocationQuery, async (req, res, next) => {
  try {
    const featureCollection = await service.getGeoJSON(pickFilters(req.query));
    res.status(200).json(featureCollection);
  } catch (error) {
    next(error);
  }
});

// GET /api/locations/:id
router.get("/:id", validateObjectId("id"), async (req, res, next) => {
  try {
    const location = await service.findOne(req.params.id);
    res.status(200).json({
      data: location.toJSON(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/locations
router.post("/", validateLocationPayload, async (req, res, next) => {
  try {
    const location = await service.create(req.body, req.user.id);
    res.status(201).json({
      message: "Ubicación creada correctamente",
      data: location,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/locations/:id
router.patch(
  "/:id",
  validateObjectId("id"),
  validateLocationUpdatePayload,
  async (req, res, next) => {
    try {
      const location = await service.update(req.params.id, req.body);
      res.status(200).json({
        message: "Ubicación actualizada correctamente",
        data: location,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/locations/:id (elimina en cascada sus solicitudes de servicio)
router.delete("/:id", validateObjectId("id"), async (req, res, next) => {
  try {
    const location = await service.delete(req.params.id);
    res.status(200).json({
      message: "Ubicación eliminada correctamente",
      data: location,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
