"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

function validPosition(position) {
  if (!Array.isArray(position) || position.length !== 2) return false;
  const [longitude, latitude] = position;
  return Number.isFinite(longitude) && Number.isFinite(latitude)
    && Math.abs(longitude) <= 180 && Math.abs(latitude) <= 90;
}

function validPolygon(polygon) {
  return polygon?.type === "Polygon" && Array.isArray(polygon.coordinates) && polygon.coordinates.length > 0
    && polygon.coordinates.every(ring => {
      return Array.isArray(ring) && ring.length >= 4 && ring.every(validPosition)
        && ring[0].every((coordinate, index) => coordinate === ring.at(-1)[index]);
    });
}

async function verify(collectionName, field, validate) {
  const collection = mongoose.connection.db.collection(collectionName);
  const indexes = await collection.indexes();
  const index = indexes.find(candidate => candidate.key[field] === "2dsphere" && !candidate.hidden);
  assert.ok(index, `Falta un índice 2dsphere visible en ${collectionName}.${field}`);

  let count = 0;
  for await (const document of collection.find({}, { projection: { _id: 0, [field]: 1 } })) {
    assert.ok(validate(document[field]), `Geometría inválida en ${collectionName}.${field}`);
    count++;
  }
  assert.ok(count > 0, `No hay geometrías para verificar en ${collectionName}`);
  console.log(`${collectionName}.${field}: ${count} documentos válidos. Índice 2dsphere: ${index.name}.`);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri || !uri.split("@").at(-1).match(/\.mongodb\.net(?=[:?,/]|$)/i)) {
    console.error("Configura MONGODB_URI con una conexión de MongoDB Atlas.");
    process.exitCode = 1;
    return;
  }
  try {
    await mongoose.connect(uri, { autoCreate: false, autoIndex: false, serverSelectionTimeoutMS: 5000 });
    await verify("locations", "location", point => point?.type === "Point" && validPosition(point.coordinates));
    await verify("zones", "area", validPolygon);
  } catch (error) {
    if (error instanceof assert.AssertionError) {
      console.error(error.message);
    } else {
      // Los errores de conexión del driver pueden incluir información de la URI.
      console.error(`No se pudo verificar Atlas: ${error.name} ${error.code ?? error.cause?.code ?? ""}`.trim());
    }
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(() => {
  console.error("No se pudo cerrar la verificación de Atlas.");
  process.exitCode = 1;
});
