import { Application } from "express";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

function swaggerConfig(app: Application): void {
  const swaggerDocument = swaggerJsDoc({
    swaggerDefinition: {
      openapi: "3.0.1",
      info: {
        title: "Express ChatApp API",
        description: "This is Express ChatApp API made with ❤️ by amirreza abdolrahimi using ExpressJS",
        version: "1.0.0",
      },
    },
    apis: [process.cwd()+ "/src/module/**/*.swagger.ts"],
  });

  const swagger = swaggerUi.setup(swaggerDocument, {});
  app.use("/", swaggerUi.serve, swagger);
}

export default swaggerConfig;
