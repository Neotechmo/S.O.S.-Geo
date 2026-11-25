"use strict";

// 3 zonas poligonales de cobertura en León, Gto.
// Cada vértice va en orden GeoJSON [longitud, latitud] y cada anillo está
// cerrado (el último vértice repite al primero).
const zones = [
  {
    key: "centro",
    name: "Zona Centro Histórico",
    description: "Cobertura del primer cuadro de la ciudad, Arco de la Calzada y Mercado Aldama.",
    color: "#f04438",
    area: {
      type: "Polygon",
      coordinates: [
        [
          [-101.6920, 21.1150],
          [-101.6740, 21.1150],
          [-101.6720, 21.1250],
          [-101.6760, 21.1330],
          [-101.6900, 21.1320],
          [-101.6920, 21.1150],
        ],
      ],
    },
  },
  {
    key: "norte",
    name: "Zona Norte - La Salle Campestre",
    description: "Cobertura de Campestre, Plaza Mayor y alrededores de La Salle Bajío.",
    color: "#12b76a",
    area: {
      type: "Polygon",
      coordinates: [
        [
          [-101.7200, 21.1400],
          [-101.6850, 21.1400],
          [-101.6830, 21.1650],
          [-101.7050, 21.1700],
          [-101.7220, 21.1600],
          [-101.7200, 21.1400],
        ],
      ],
    },
  },
  {
    key: "oriente",
    name: "Zona Oriente - Poliforum",
    description: "Cobertura de Poliforum, Estadio León, Explora y Central de Autobuses.",
    color: "#1570ef",
    area: {
      type: "Polygon",
      coordinates: [
        [
          [-101.6700, 21.1000],
          [-101.6420, 21.1000],
          [-101.6400, 21.1220],
          [-101.6550, 21.1280],
          [-101.6700, 21.1230],
          [-101.6700, 21.1000],
        ],
      ],
    },
  },
];

module.exports = zones;
