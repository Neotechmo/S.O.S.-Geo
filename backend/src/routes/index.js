"use strict";

const express = require("express");
const authRouter = require("./auth.router");

function routerApi(app) {
  const apiRouter = express.Router();

  app.use("/api", apiRouter);

  apiRouter.use("/auth", authRouter);

  // Los routers de cada entidad se registran aquí conforme se implementan:
  // apiRouter.use("/categories", categoriesRouter);
  // apiRouter.use("/zones", zonesRouter);
  // apiRouter.use("/professionals", professionalsRouter);
  // apiRouter.use("/locations", locationsRouter);
  // apiRouter.use("/service-requests", serviceRequestsRouter);
}

module.exports = routerApi;
