"use strict";

const AppError = require("../utils/appError");
const { HEX_COLOR_REGEX } = require("../models/zone.model");

const ALLOWED_FIELDS = ["name", "description", "color", "coordinates", "area"];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// Extrae la matriz [[[lng, lat], ...]] tanto si viene en body.coordinates como en body.area.coordinates
function extractCoordinates(body, details) {
  if (body.coordinates !== undefined && body.area !== undefined) {
    details.push(
      "Envía las coordenadas en 'coordinates' o dentro de 'area', no en ambos"
    );
    return null;
  }

  if (body.area !== undefined) {
    if (
      !body.area ||
      typeof body.area !== "object" ||
      Array.isArray(body.area)
    ) {
      details.push("El campo area debe ser un objeto GeoJSON Polygon");
      return null;
    }

    if (body.area.type !== undefined && body.area.type !== "Polygon") {
      details.push('El tipo GeoJSON de area debe ser "Polygon"');
    }

    return body.area.coordinates;
  }

  return body.coordinates;
}

// Valida que coordinates sea un GeoJSON Polygon [[[lng, lat], ...]] válido y cerrado
function validatePolygonCoordinates(rawCoordinates, details) {
  if (!Array.isArray(rawCoordinates) || rawCoordinates.length === 0) {
    details.push(
      "Las coordenadas del polígono son obligatorias y deben ser un arreglo de anillos [[[longitud, latitud]]]"
    );
    return null;
  }

  const normalizedRings = [];

  rawCoordinates.forEach((ring, ringIndex) => {
    if (!Array.isArray(ring)) {
      details.push(`El anillo ${ringIndex + 1} del polígono debe ser un arreglo de vértices`);
      return;
    }

    if (ring.length < 4) {
      details.push(
        `El anillo ${ringIndex + 1} debe contener al menos 4 posiciones (mínimo 3 vértices y el vértice de cierre)`
      );
      return;
    }

    const normalizedRing = [];
    let hasInvalidVertex = false;

    ring.forEach((vertex, vertexIndex) => {
      if (!Array.isArray(vertex) || vertex.length !== 2) {
        details.push(
          `El vértice ${vertexIndex + 1} del anillo ${ringIndex + 1} debe tener exactamente 2 valores [longitud, latitud]`
        );
        hasInvalidVertex = true;
        return;
      }

      const [rawLng, rawLat] = vertex;
      const longitude =
        typeof rawLng === "boolean" || rawLng === null || rawLng === ""
          ? NaN
          : Number(rawLng);
      const latitude =
        typeof rawLat === "boolean" || rawLat === null || rawLat === ""
          ? NaN
          : Number(rawLat);

      if (!Number.isFinite(longitude)) {
        details.push(
          `La longitud del vértice ${vertexIndex + 1} debe ser numérica`
        );
        hasInvalidVertex = true;
      } else if (longitude < -180 || longitude > 180) {
        details.push(
          `La longitud del vértice ${vertexIndex + 1} (${longitude}) debe estar entre -180 y 180`
        );
        hasInvalidVertex = true;
      }

      if (!Number.isFinite(latitude)) {
        details.push(
          `La latitud del vértice ${vertexIndex + 1} debe ser numérica`
        );
        hasInvalidVertex = true;
      } else if (latitude < -90 || latitude > 90) {
        details.push(
          `La latitud del vértice ${vertexIndex + 1} (${latitude}) debe estar entre -90 y 90`
        );
        hasInvalidVertex = true;
      }

      normalizedRing.push([longitude, latitude]);
    });

    if (!hasInvalidVertex && normalizedRing.length >= 4) {
      const firstVertex = normalizedRing[0];
      const lastVertex = normalizedRing[normalizedRing.length - 1];

      if (
        firstVertex[0] !== lastVertex[0] ||
        firstVertex[1] !== lastVertex[1]
      ) {
        details.push(
          `El anillo ${ringIndex + 1} del polígono debe estar cerrado: el primer vértice [${firstVertex[0]}, ${firstVertex[1]}] y el último [${lastVertex[0]}, ${lastVertex[1]}] deben ser iguales`
        );
      }
    }

    normalizedRings.push(normalizedRing);
  });

  return normalizedRings;
}

function collectErrors(body, { partial }) {
  const details = [];

  const unknownFields = Object.keys(body).filter(
    (field) => !ALLOWED_FIELDS.includes(field)
  );
  if (unknownFields.length > 0) {
    details.push(`Campos no permitidos: ${unknownFields.join(", ")}`);
  }

  if (partial && Object.keys(body).length === 0) {
    details.push("Debes enviar al menos un campo para actualizar");
    return details;
  }

  if (!partial) {
    if (body.name === undefined) {
      details.push("El campo name es obligatorio");
    }
    if (body.coordinates === undefined && body.area === undefined) {
      details.push("El campo coordinates (o area) es obligatorio");
    }
  }

  if (body.name !== undefined) {
    if (!isNonEmptyString(body.name)) {
      details.push("El nombre de la zona es obligatorio y debe ser texto");
    } else {
      const nameLength = body.name.trim().length;
      if (nameLength < 3) {
        details.push("El nombre de la zona debe tener al menos 3 caracteres");
      } else if (nameLength > 80) {
        details.push("El nombre de la zona no puede superar los 80 caracteres");
      }
    }
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      details.push("La descripción debe ser texto");
    } else if (body.description.trim().length > 200) {
      details.push("La descripción no puede superar los 200 caracteres");
    }
  }

  if (body.color !== undefined) {
    if (
      typeof body.color !== "string" ||
      !HEX_COLOR_REGEX.test(body.color.trim())
    ) {
      details.push("El color debe tener el formato hexadecimal #RRGGBB");
    }
  }

  const hasCoordinatesInput =
    body.coordinates !== undefined || body.area !== undefined;

  if (hasCoordinatesInput) {
    const rawCoordinates = extractCoordinates(body, details);
    if (rawCoordinates !== null) {
      const normalized = validatePolygonCoordinates(rawCoordinates, details);
      if (normalized && details.length === 0) {
        body.coordinates = normalized;
      }
    }
  }

  return details;
}

function buildValidator(partial, errorMessage) {
  return function validateZone(req, res, next) {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return next(
        new AppError(400, errorMessage, ["El cuerpo debe ser un objeto JSON"])
      );
    }

    const details = collectErrors(body, { partial });
    if (details.length > 0) {
      return next(new AppError(400, errorMessage, details));
    }

    next();
  };
}

// POST /api/zones
const validateZonePayload = buildValidator(false, "Datos de la zona inválidos");

// PATCH /api/zones/:id
const validateZoneUpdatePayload = buildValidator(
  true,
  "Datos de actualización de la zona inválidos"
);

module.exports = {
  validateZonePayload,
  validateZoneUpdatePayload,
};
