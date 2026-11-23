"use strict";

const express = require("express");

function routerApi(app) {
  const apiRouter = express.Router();

  app.use("/api", apiRouter);

  // Los routers de cada entidad se registran aquí conforme se implementan:
  // apiRouter.use("/auth", authRouter);
  // apiRouter.use("/categories", categoriesRouter);
  // apiRouter.use("/zones", zonesRouter);
  // apiRouter.use("/professionals", professionalsRouter);
  // apiRouter.use("/locations", locationsRouter);
  // apiRouter.use("/service-requests", serviceRequestsRouter);
}

module.exports = routerApi;
