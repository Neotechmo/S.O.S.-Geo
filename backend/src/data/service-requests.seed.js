"use strict";

// 5 solicitudes de servicio. "category", "location" y "professional" son claves
// que seed.js reemplaza por ObjectId; requestedBy se asigna al usuario demo.
const serviceRequests = [
  {
    folio: "SOS-2026-0001",
    title: "Auto descompuesto en Blvd. Adolfo López Mateos",
    description: "Vehículo sin batería frente al Poliforum, se requiere paso de corriente o remolque.",
    priority: "alta",
    status: "en_proceso",
    contactName: "Andrea Morales",
    contactPhone: "477 101 2233",
    category: "vial",
    location: "base-gruas-poliforum",
    professional: "grua-ramirez",
  },
  {
    folio: "SOS-2026-0002",
    title: "Fuga de agua en local del Mercado Aldama",
    description: "Tubería rota inunda el pasillo del local 14, se necesita cortar el suministro.",
    priority: "critica",
    status: "pendiente",
    contactName: "Roberto Salinas",
    contactPhone: "477 202 3344",
    category: "plomeria",
    location: "plomeria-aldama",
    professional: "plomero-lopez",
  },
  {
    folio: "SOS-2026-0003",
    title: "Apagón parcial en oficina de Plaza Mayor",
    description: "Se botó el interruptor principal y no restablece, hay equipo de cómputo sin energía.",
    priority: "media",
    status: "atendida",
    contactName: "Paola Jiménez",
    contactPhone: "477 303 4455",
    category: "electricidad",
    location: "electrica-plaza-mayor",
    professional: "electricista-garcia",
  },
  {
    folio: "SOS-2026-0004",
    title: "Llaves olvidadas dentro del auto",
    description: "Auto cerrado con las llaves dentro a un costado del Templo Expiatorio.",
    priority: "baja",
    status: "pendiente",
    contactName: "Luis Fernando Cruz",
    contactPhone: "477 404 5566",
    category: "cerrajeria",
    location: "cerrajeria-expiatorio",
    professional: null,
  },
  {
    folio: "SOS-2026-0005",
    title: "Neumático ponchado en Campestre",
    description: "Llanta ponchada sin refacción en buen estado, se solicita apoyo a domicilio.",
    priority: "media",
    status: "cancelada",
    contactName: "Mariana Ortega",
    contactPhone: "477 505 6677",
    category: "vial",
    location: "taller-campestre",
    professional: "vial-hernandez",
  },
];

module.exports = serviceRequests;
