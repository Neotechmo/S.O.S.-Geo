"use strict";

const express = require("express");
const authRouter = require("./auth.router");
const categoriesRouter = require("./categories.router");
const zonesRouter = require("./zones.router");
const professionalsRouter = require("./professionals.router");
const locationsRouter = require("./locations.router");

function routerApi(app) {
  const apiRouter = express.Router();

  app.use("/api", apiRouter);

  apiRouter.use("/auth", authRouter);
  apiRouter.use("/categories", categoriesRouter);
  apiRouter.use("/zones", zonesRouter);
  apiRouter.use("/professionals", professionalsRouter);
  apiRouter.use("/locations", locationsRouter);

  // Los routers de cada entidad se registran aquí conforme se implementan:
  // apiRouter.use("/service-requests", serviceRequestsRouter);
}

module.exports = routerApi;
