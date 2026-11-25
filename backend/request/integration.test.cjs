"use strict";

const assert = require("node:assert/strict");
const { once } = require("node:events");
const { randomUUID } = require("node:crypto");
const { after, before, describe, it } = require("node:test");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const runHttpCollection = require("./run-http-collection.cjs");

const qaId = randomUUID().replaceAll("-", "");
const databaseName = `sos_geo_qa_${qaId}`;
process.env.JWT_SECRET = randomUUID();
const app = require("../src/app");
const Location = require("../src/models/location.model");
const Zone = require("../src/models/zone.model");
const User = require("../src/models/user.model");

const coordinates = [-101.6812, 21.1248];
const area = { type: "Polygon", coordinates: [[
  [-101.69, 21.12], [-101.67, 21.12], [-101.67, 21.14],
  [-101.69, 21.14], [-101.69, 21.12],
]] };
const account = { name: "Cuenta de pruebas", email: "qa@example.test", password: "QaPassword123!" };
const categoryInput = {
  name: "Auxilio QA", description: "Categoría de integración", color: "#1570ef", icon: "car",
};
let server, baseUrl, token, category, professional, location, zone;

async function request(method, path, status, body, authorization = token) {
  const headers = {};
  if (authorization) headers.authorization = `Bearer ${authorization}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(`${baseUrl}${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
  const json = await response.json();
  assert.equal(response.status, status, `${method} ${path}: ${json.error?.message ?? "estado inesperado"}`);
  if (status >= 400) {
    assert.equal(json.error.status, status);
    assert.equal(json.error.path, `/api${path}`);
    assert.ok(json.error.message);
  }
  return json;
}

const post = (path, body, status = 201) => request("POST", path, status, body);
const get = (path, status = 200) => request("GET", path, status);
const patch = (path, body, status = 200) => request("PATCH", path, status, body);
const remove = (path, status = 200) => request("DELETE", path, status);

function locationInput(overrides = {}) {
  const [longitude, latitude] = coordinates;
  return {
    name: "Taller del Bajío", description: "Atención de auxilio vial",
    category: category.id, status: "activo", latitude, longitude, ...overrides,
  };
}

describe("Matriz de integración S.O.S. Geo", () => {
  before(async () => {
    const port = Number(process.env.QA_MONGO_PORT || 27017);
    assert.ok(Number.isInteger(port) && port > 0 && port <= 65535, "Puerto local de MongoDB inválido");
    await mongoose.connect(`mongodb://127.0.0.1:${port}/${databaseName}`, { serverSelectionTimeoutMS: 4000 });
    await Promise.all(Object.values(mongoose.models).map(model => model.init()));
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  });

  after(async () => {
    try {
      if (server) await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
      if (mongoose.connection.readyState === 1 && mongoose.connection.name === databaseName) {
        await mongoose.connection.dropDatabase();
      }
    } finally {
      await mongoose.disconnect();
    }
  });

  it("1. Autenticación correcta e incorrecta", async () => {
    await post("/auth/login", { email: account.email, password: "Incorrecta123" }, 401);
    await post("/auth/register", account);
    const login = await post("/auth/login", { email: account.email, password: account.password }, 200);
    token = login.token;
    assert.match(token, /^[\w-]+\.[\w-]+\.[\w-]+$/);
    assert.equal((await get("/auth/me")).data.email, account.email);
    await post("/auth/login", { email: account.email, password: "Incorrecta123" }, 401);
  });

  it("2. Registro y duplicado con contraseña cifrada", async () => {
    const newAccount = { ...account, email: "qa-registro@example.test" };
    const registered = await post("/auth/register", newAccount);
    assert.equal(registered.user.email, newAccount.email);
    assert.equal(registered.user.password, undefined);
    await post("/auth/register", { ...newAccount, email: newAccount.email.toUpperCase() }, 400);
    const stored = await User.findOne({ email: newAccount.email }).select("+password");
    assert.match(stored.password, /^\$2[aby]\$/);
    assert.equal(await bcrypt.compare(newAccount.password, stored.password), true);
  });

  it("3. Rutas protegidas sin token y con token inválido", async () => {
    for (const path of ["/auth/me", "/categories", "/professionals", "/service-requests",
      "/locations", "/locations/geojson", "/zones", "/zones/geojson"]) {
      await request("GET", path, 401, undefined, null);
    }
    await request("GET", "/locations", 401, undefined, "jwt-invalido");
  });

  it("4. CRUD de categorías, profesionales y solicitudes con referencias pobladas", async () => {
    category = (await post("/categories", categoryInput)).data;
    await post("/categories", { ...categoryInput, name: "AUXILIO QA" }, 400);
    assert.equal((await get("/categories")).data[0].id, category.id);
    assert.equal((await get(`/categories/${category.id}`)).data.name, categoryInput.name);
    category = (await patch(`/categories/${category.id}`, { name: "Auxilio QA editado" })).data;

    zone = (await post("/zones", { name: "Zona QA", area })).data;
    const worker = {
      fullName: "Profesional QA", specialty: "Auxilio vial", phone: "4771234567",
      email: "profesional@example.test", experienceYears: 3, category: category.id, zone: zone.id,
    };
    professional = (await post("/professionals", worker)).data;
    await post("/professionals", worker, 400);
    const found = (await get(`/professionals?category=${category.id}&zone=${zone.id}`)).data[0];
    assert.equal(found.category.name, category.name);
    assert.equal(found.zone.name, zone.name);
    assert.equal((await get(`/professionals/${professional.id}`)).data.fullName, worker.fullName);
    assert.equal((await patch(`/professionals/${professional.id}`, { status: "en_servicio" })).data.status, "en_servicio");

    location = (await post("/locations", locationInput({ primaryProfessional: professional.id }))).data;
    const created = (await post("/service-requests", {
      title: "Solicitud auxilio QA", description: "Descripción de integración",
      contactName: "Contacto QA", contactPhone: "4771234567", priority: "alta",
      category: category.id, location: location.id, professional: professional.id,
    })).data;
    const list = (await get("/service-requests?status=pendiente&priority=alta&search=auxilio")).data;
    assert.deepEqual(list.map(row => row.id), [created.id]);
    const entry = (await get(`/service-requests/${created.id}`)).data;
    assert.deepEqual([entry.category.name, entry.location.name, entry.professional.fullName, entry.requestedBy.name],
      [category.name, location.name, worker.fullName, account.name]);
    const updated = (await patch(`/service-requests/${created.id}`, { status: "atendida", priority: "critica" })).data;
    assert.deepEqual([updated.status, updated.priority], ["atendida", "critica"]);
    await remove(`/service-requests/${created.id}`);
    await get(`/service-requests/${created.id}`, 404);
  });

  it("5. Altas, ediciones y bajas de puntos", async () => {
    const point = (await post("/locations", locationInput({ name: "Punto de prueba temporal" }))).data;
    assert.deepEqual(point.location, { type: "Point", coordinates });
    assert.equal((await get(`/locations/${point.id}`)).data.category.name, category.name);
    const changed = (await patch(`/locations/${point.id}`, { status: "inactivo", longitude: -101.68, latitude: 21.13 })).data;
    assert.equal(changed.status, "inactivo");
    assert.deepEqual(changed.location.coordinates, [-101.68, 21.13]);
    await remove(`/locations/${point.id}`);
    await get(`/locations/${point.id}`, 404);
  });

  it("6. Datos poblados para mapa y tabla", async () => {
    const result = (await get("/locations")).data;
    assert.deepEqual(result.map(row => row.id), [location.id]);
    assert.equal(result[0].category.name, category.name);
    assert.equal(result[0].primaryProfessional.id, professional.id);
    assert.equal(result[0].registeredBy.name, account.name);
    const geojson = await get("/locations/geojson?status=activo");
    assert.equal(geojson.type, "FeatureCollection");
    assert.deepEqual(geojson.features[0].geometry, { type: "Point", coordinates });
  });

  it("7. Filtros combinados y búsqueda insensible a mayúsculas", async () => {
    const query = `search=TA%4CLER&category=${category.id}`;
    assert.deepEqual((await get(`/locations?${query}&status=activo`)).data.map(row => row.id), [location.id]);
    assert.deepEqual((await get(`/locations?${query}&status=inactivo`)).data, []);
    await get("/locations?status=abierto", 400);
  });

  it("8. Persistencia de polígonos, GeoJSON e índices geoespaciales locales", async () => {
    assert.deepEqual((await get("/zones")).data.find(row => row.id === zone.id).area, area);
    assert.deepEqual((await get(`/zones/${zone.id}`)).data.area, area);
    assert.equal((await patch(`/zones/${zone.id}`, { name: "Zona QA editada" })).data.name, "Zona QA editada");
    const geojson = await get("/zones/geojson");
    assert.equal(geojson.type, "FeatureCollection");
    assert.deepEqual(geojson.features.find(feature => feature.properties.id === zone.id).geometry, area);
    const point = await Location.collection.findOne({ _id: new mongoose.Types.ObjectId(location.id) });
    const polygon = await Zone.collection.findOne({ _id: new mongoose.Types.ObjectId(zone.id) });
    assert.deepEqual(point.location, { type: "Point", coordinates });
    assert.deepEqual(polygon.area, area);
    assert.ok((await Location.collection.indexes()).some(index => index.key.location === "2dsphere"));
    assert.ok((await Zone.collection.indexes()).some(index => index.key.area === "2dsphere"));
    await remove(`/zones/${zone.id}`);
    await get(`/zones/${zone.id}`, 404);
    assert.equal((await get(`/professionals/${professional.id}`)).data.zone, null);
  });

  it("9. Integridad referencial y eliminación de profesional y categoría", async () => {
    const { error } = await remove(`/categories/${category.id}`, 400);
    assert.match(error.message, /registros asociados/i);
    await remove(`/professionals/${professional.id}`);
    await get(`/professionals/${professional.id}`, 404);
    assert.equal((await get(`/locations/${location.id}`)).data.primaryProfessional, null);
    await remove(`/locations/${location.id}`);
    await remove(`/categories/${category.id}`);
    await get(`/categories/${category.id}`, 404);
  });

  it("10. Rechazo de coordenadas y anillos inválidos", async () => {
    await post("/locations", locationInput({ latitude: 120, longitude: -250 }), 400);
    await post("/zones", { name: "Zona abierta", coordinates: [area.coordinates[0].slice(0, -1)] }, 400);
  });

  it("11. Respuestas 200, 400, 404 y fallo 500 controlado", async t => {
    assert.equal((await get("/health")).status, "OK");
    await get("/no-existe", 404);
    await get("/locations/123", 400);
    await get(`/locations/${new mongoose.Types.ObjectId()}`, 404);
    t.mock.method(Location, "find", () => { throw new Error("QA: fallo simulado de persistencia"); });
    const { error } = await get("/locations", 500);
    assert.equal(error.message, "Ocurrió un error interno del servidor");
    assert.equal(error.stack, undefined);
  });

  const frontendUrl = process.env.QA_PUBLIC_FRONTEND_URL;
  const backendUrl = process.env.QA_PUBLIC_API_URL;
  it("12. Disponibilidad del despliegue público", {
    skip: (!frontendUrl || !backendUrl) && "Faltan las URLs públicas del frontend y la API",
  }, async () => {
    const frontend = new URL("/map", frontendUrl);
    const backend = new URL(backendUrl);
    assert.equal(frontend.protocol, "https:");
    assert.equal(backend.protocol, "https:");
    const [page, health] = await Promise.all([
      fetch(frontend, { signal: AbortSignal.timeout(15000) }),
      fetch(new URL("health", backend.href.replace(/\/?$/, "/")), { signal: AbortSignal.timeout(60000) }),
    ]);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /<app-root[\s>]/);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).status, "OK");
  });

  it("Colección REST Client: verifica todos los archivos .http", async t => {
    const count = await runHttpCollection(new URL(baseUrl).origin);
    t.diagnostic(`${count} peticiones HTTP verificadas`);
  });
});
