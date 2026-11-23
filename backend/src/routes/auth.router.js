"use strict";

const express = require("express");
const AuthService = require("../services/auth.service");
const { requireAuth } = require("../middlewares/auth.handler");
const {
  validateRegisterPayload,
  validateLoginPayload,
} = require("../middlewares/auth.validator");

const router = express.Router();
const service = new AuthService();

// POST /api/auth/register
router.post("/register", validateRegisterPayload, async (req, res, next) => {
  try {
    const { token, user } = await service.register(req.body);
    res.status(201).json({
      message: "Usuario registrado correctamente",
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post("/login", validateLoginPayload, async (req, res, next) => {
  try {
    const { token, user } = await service.login(req.body);
    res.status(200).json({
      message: "Autenticación exitosa",
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me (protegida)
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await service.getProfile(req.user.id);
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
