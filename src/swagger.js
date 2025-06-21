import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Tasas BCV",
      version: "1.0.0",
      description:
        "API para obtener tasas de cambio del Banco Central de Venezuela",
      contact: {
        name: "Elber Nava",
        email: "elbernava11@gmail.com",
      },
    },
    tags: [
      {
        name: "Tasas",
        description: "Operaciones con tasas de cambio",
      },
    ],
  },
  apis: ["./src/index.js"], // Ruta a tus archivos de rutas
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  app.use("/doc", swaggerUi.serve, swaggerUi.setup(specs));
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });
};
