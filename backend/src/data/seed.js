"use strict";

// Script de carga inicial: `npm run seed`
// 1. Limpia todas las colecciones (de dependientes a independientes).
// 2. Inserta en orden de dependencias y enlaza cada referencia por ObjectId.

require("dotenv").config();

const {
  connectDatabase,
  disconnectDatabase,
} = require("../config/database");

const UserModel = require("../models/user.model");
const CategoryModel = require("../models/category.model");
const ZoneModel = require("../models/zone.model");
const ProfessionalModel = require("../models/professional.model");
const LocationModel = require("../models/location.model");
const ServiceRequestModel = require("../models/service-request.model");

const usersSeed = require("./users.seed");
const { DEMO_USER } = require("./users.seed");
const categoriesSeed = require("./categories.seed");
const zonesSeed = require("./zones.seed");
const professionalsSeed = require("./professionals.seed");
const locationsSeed = require("./locations.seed");
const serviceRequestsSeed = require("./service-requests.seed");

// Quita la propiedad "key" (solo sirve para enlazar dentro del seed)
function withoutKey({ key, ...rest }) {
  return rest;
}

// Construye un mapa { key: ObjectId } a partir de los documentos insertados
function buildIdMap(seedItems, insertedDocs) {
  return seedItems.reduce((map, item, index) => {
    map[item.key] = insertedDocs[index]._id;
    return map;
  }, {});
}

// Resuelve una clave a su ObjectId; null se respeta como referencia opcional vacía
function resolveRef(map, key, entity) {
  if (key === null || key === undefined) {
    return null;
  }

  if (!map[key]) {
    throw new Error(`Referencia inválida en el seed: ${entity} "${key}" no existe`);
  }

  return map[key];
}

async function clearCollections() {
  // Orden inverso de dependencias para no dejar referencias huérfanas a medio camino
  await ServiceRequestModel.deleteMany({});
  await LocationModel.deleteMany({});
  await ProfessionalModel.deleteMany({});
  await ZoneModel.deleteMany({});
  await CategoryModel.deleteMany({});
  await UserModel.deleteMany({});
}

async function syncIndexes() {
  // Garantiza los índices únicos y 2dsphere antes de insertar
  await Promise.all([
    UserModel.syncIndexes(),
    CategoryModel.syncIndexes(),
    ZoneModel.syncIndexes(),
    ProfessionalModel.syncIndexes(),
    LocationModel.syncIndexes(),
    ServiceRequestModel.syncIndexes(),
  ]);
}

async function seed() {
  await connectDatabase();

  console.log("Limpiando colecciones...");
  await clearCollections();
  await syncIndexes();

  // USUARIOS: create() dispara el hook pre("save") que cifra la contraseña con bcrypt
  const users = [];
  for (const user of usersSeed) {
    users.push(await UserModel.create(withoutKey(user)));
  }
  const userIds = buildIdMap(usersSeed, users);
  const demoUserId = userIds[DEMO_USER.key];

  // CATEGORÍAS
  const categories = await CategoryModel.insertMany(categoriesSeed.map(withoutKey));
  const categoryIds = buildIdMap(categoriesSeed, categories);

  // ZONAS (creadas por el usuario demo)
  const zones = await ZoneModel.insertMany(
    zonesSeed.map((zone) => ({ ...withoutKey(zone), createdBy: demoUserId }))
  );
  const zoneIds = buildIdMap(zonesSeed, zones);

  // PROFESIONALES (category y zone por ObjectId)
  const professionals = await ProfessionalModel.insertMany(
    professionalsSeed.map((professional) => ({
      ...withoutKey(professional),
      category: resolveRef(categoryIds, professional.category, "categoría"),
      zone: resolveRef(zoneIds, professional.zone, "zona"),
    }))
  );
  const professionalIds = buildIdMap(professionalsSeed, professionals);

  // UBICACIONES (GeoJSON Point en [longitud, latitud])
  const locations = await LocationModel.insertMany(
    locationsSeed.map(({ coordinates, ...location }) => ({
      ...withoutKey(location),
      category: resolveRef(categoryIds, location.category, "categoría"),
      primaryProfessional: resolveRef(
        professionalIds,
        location.primaryProfessional,
        "profesional"
      ),
      registeredBy: demoUserId,
      location: { type: "Point", coordinates },
    }))
  );
  const locationIds = buildIdMap(locationsSeed, locations);

  // SOLICITUDES DE SERVICIO
  const serviceRequests = await ServiceRequestModel.insertMany(
    serviceRequestsSeed.map((request) => ({
      ...request,
      category: resolveRef(categoryIds, request.category, "categoría"),
      location: resolveRef(locationIds, request.location, "ubicación"),
      professional: resolveRef(professionalIds, request.professional, "profesional"),
      requestedBy: demoUserId,
    }))
  );

  console.log("");
  console.log("==============================");
  console.log("SEED COMPLETADO");
  console.log("==============================");
  console.log(`Usuarios:              ${users.length}`);
  console.log(`Categorías:            ${categories.length}`);
  console.log(`Zonas:                 ${zones.length}`);
  console.log(`Profesionales:         ${professionals.length}`);
  console.log(`Ubicaciones:           ${locations.length}`);
  console.log(`Solicitudes servicio:  ${serviceRequests.length}`);
  console.log("------------------------------");
  console.log("Usuario de prueba:");
  console.log(`  Correo:      ${DEMO_USER.email}`);
  console.log(`  Contraseña:  ${DEMO_USER.password}`);
  console.log("==============================");
}

seed()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Error al ejecutar el seed:", error.message);
    await disconnectDatabase();
    process.exit(1);
  });
