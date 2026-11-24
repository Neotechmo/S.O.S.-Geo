"use strict";

const express = require("express");
const ServiceRequestsService = require("../services/service-requests.service");
const { requireAuth } = require("../middlewares/auth.handler");
const { validateObjectId } = require("../middlewares/objectId.validator");
const {
  validateServiceRequestPayload,
  validateServiceRequestUpdatePayload,
  validateServiceRequestQuery,
} = require("../middlewares/service-request.validator");

const router = express.Router();
const service = new ServiceRequestsService();

// Todas las rutas de solicitudes requieren JWT
router.use(requireAuth);

// GET /api/service-requests?status=&priority=&category=&location=&search=
router.get("/", validateServiceRequestQuery, async (req, res, next) => {
  try {
    const requests = await service.find({
      status: req.query.status,
      priority: req.query.priority,
      category: req.query.category,
      location: req.query.location,
      search: req.query.search,
    });

    res.status(200).json({
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/service-requests/:id
router.get("/:id", validateObjectId("id"), async (req, res, next) => {
  try {
    const request = await service.findOne(req.params.id);
    res.status(200).json({
      data: request.toJSON(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/service-requests
router.post("/", validateServiceRequestPayload, async (req, res, next) => {
  try {
    const request = await service.create(req.body, req.user.id);
    res.status(201).json({
      message: "Solicitud de servicio creada correctamente",
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/service-requests/:id
router.patch(
  "/:id",
  validateObjectId("id"),
  validateServiceRequestUpdatePayload,
  async (req, res, next) => {
    try {
      const request = await service.update(req.params.id, req.body);
      res.status(200).json({
        message: "Solicitud de servicio actualizada correctamente",
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/service-requests/:id
router.delete("/:id", validateObjectId("id"), async (req, res, next) => {
  try {
    const request = await service.delete(req.params.id);
    res.status(200).json({
      message: "Solicitud de servicio eliminada correctamente",
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
