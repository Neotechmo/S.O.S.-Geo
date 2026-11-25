"use strict";

// 6 profesionales. "category" y "zone" son claves de categories.seed.js y
// zones.seed.js que seed.js reemplaza por los ObjectId reales.
const professionals = [
  {
    key: "grua-ramirez",
    fullName: "Jorge Ramírez Torres",
    specialty: "Operador de grúa y remolque ligero",
    phone: "477 210 3344",
    email: "jorge.ramirez@sosgeo.mx",
    experienceYears: 12,
    status: "disponible",
    category: "vial",
    zone: "oriente",
  },
  {
    key: "vial-hernandez",
    fullName: "Lucía Hernández Pérez",
    specialty: "Mecánica automotriz y paso de corriente",
    phone: "477 318 9021",
    email: "lucia.hernandez@sosgeo.mx",
    experienceYears: 7,
    status: "en_servicio",
    category: "vial",
    zone: "norte",
  },
  {
    key: "plomero-lopez",
    fullName: "Miguel Ángel López Rocha",
    specialty: "Plomería residencial y detección de fugas",
    phone: "477 455 1287",
    email: "miguel.lopez@sosgeo.mx",
    experienceYears: 15,
    status: "disponible",
    category: "plomeria",
    zone: "centro",
  },
  {
    key: "electricista-garcia",
    fullName: "Fernanda García Mendoza",
    specialty: "Electricista certificada en instalaciones residenciales",
    phone: "477 562 7710",
    email: "fernanda.garcia@sosgeo.mx",
    experienceYears: 9,
    status: "disponible",
    category: "electricidad",
    zone: "norte",
  },
  {
    key: "electricista-martinez",
    fullName: "Ricardo Martínez Solís",
    specialty: "Tableros eléctricos y subestaciones comerciales",
    phone: "477 673 4455",
    email: "ricardo.martinez@sosgeo.mx",
    experienceYears: 20,
    status: "inactivo",
    category: "electricidad",
    zone: "oriente",
  },
  {
    key: "cerrajero-navarro",
    fullName: "Daniela Navarro Ruiz",
    specialty: "Cerrajería automotriz y residencial 24/7",
    phone: "477 781 0098",
    email: "daniela.navarro@sosgeo.mx",
    experienceYears: 5,
    status: "disponible",
    category: "cerrajeria",
    zone: "centro",
  },
];

module.exports = professionals;
