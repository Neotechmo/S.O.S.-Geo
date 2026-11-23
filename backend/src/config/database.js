"use strict";

const mongoose = require("mongoose");

// Abre la conexión con MongoDB Atlas usando la cadena de conexión del archivo .env
async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Falta la variable MONGODB_URI en el archivo .env");
  }

  await mongoose.connect(uri);

  console.log(`MongoDB conectado a la base: ${mongoose.connection.name}`);
}

// Cierra la conexión con la base de datos de forma controlada al apagar el servidor
async function disconnectDatabase() {
  await mongoose.disconnect();
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
};
