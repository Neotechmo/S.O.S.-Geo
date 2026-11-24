"use strict";

// 4 categorías de servicios de emergencia. "key" solo se usa dentro del seed
// para enlazar las demás colecciones; no se guarda en MongoDB.
const categories = [
  {
    key: "vial",
    name: "Auxilio Vial",
    description: "Grúas, cambio de neumático, paso de corriente y remolque ligero.",
    color: "#f79009",
    icon: "car",
  },
  {
    key: "plomeria",
    name: "Plomería",
    description: "Fugas de agua, tuberías rotas, drenajes tapados y calentadores.",
    color: "#1570ef",
    icon: "droplet",
  },
  {
    key: "electricidad",
    name: "Electricidad",
    description: "Cortos circuitos, apagones parciales, tableros y cableado de emergencia.",
    color: "#fdb022",
    icon: "zap",
  },
  {
    key: "cerrajeria",
    name: "Cerrajería",
    description: "Apertura de puertas y autos, cambio de chapas y duplicado de llaves.",
    color: "#7a5af8",
    icon: "key",
  },
];

module.exports = categories;
