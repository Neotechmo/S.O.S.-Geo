"use strict";

const app = require("./app");
const {
  connectDatabase,
  disconnectDatabase,
} = require("./config/database");

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    // 1. Primero se abre la conexión con MongoDB Atlas
    await connectDatabase();

    // 2. Y solo si conectó, levantamos el servidor Express
    const server = app.listen(PORT, () => {
      console.log("");
      console.log("==============================");
      console.log("API DE S.O.S. GEO");
      console.log("==============================");
      console.log(`Servidor: http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
      console.log("==============================");
      console.log("");
    });

    // CIERRE CONTROLADO (Ctrl + C o cuando el sistema detiene el proceso)
    function shutdown(signal) {
      console.log(`\nSe recibió ${signal}. Cerrando servidor...`);

      server.close(async () => {
        await disconnectDatabase();
        console.log("Servidor cerrado correctamente.");
        process.exit(0);
      });
    }

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.log("No se pudo conectar a MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();
