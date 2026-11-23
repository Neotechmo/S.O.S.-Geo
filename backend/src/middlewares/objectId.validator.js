"use strict";

const mongoose = require("mongoose");
const AppError = require("../utils/appError");

// Valida que req.params[paramName] sea un ObjectId de MongoDB válido.
// Evita que Mongoose lance un CastError (500) con IDs mal formados.
function validateObjectId(paramName = "id") {
  return function validateIdParam(req, res, next) {
    const value = req.params[paramName];

    if (!mongoose.isValidObjectId(value) || String(value).length !== 24) {
      return next(
        new AppError(400, "El ID proporcionado no es válido", [
          `"${value}" no es un ObjectId de MongoDB`,
        ])
      );
    }

    next();
  };
}

module.exports = {
  validateObjectId,
};
