import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "../docs/openapi.js";

export class Swagger {
  mount(app: Express): void {
    app.get("/docs.json", (_req, res) => {
      res.json(openApiDocument);
    });

    app.use(
      "/docs",
      swaggerUi.serve,
      swaggerUi.setup(openApiDocument, {
        customSiteTitle: "example API docs",
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
        },
      }),
    );
  }
}

export const swagger = new Swagger();
