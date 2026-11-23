"use strict";

const express = require("express");
const authRouter = require("./auth.router");
const categoriesRouter = require("./categories.router");
const zonesRouter = require("./zones.router");

function routerApi(app) {
  const apiRouter = express.Router();

  app.use("/api", apiRouter);

  apiRouter.use("/auth", authRouter);
  apiRouter.use("/categories", categoriesRouter);
  apiRouter.use("/zones", zonesRouter);

  // Los routers de cada entidad se registran aquí conforme se implementan:
  // apiRouter.use("/professionals", professionalsRouter);
  // apiRouter.use("/locations", locationsRouter);
  // apiRouter.use("/service-requests", serviceRequestsRouter);
}

module.exports = routerApi;
