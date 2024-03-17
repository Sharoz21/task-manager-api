import swaggerAutogen from "swagger-autogen";
import "dotenv/config";
import User from "../models/user";
import Task from "../models/task";
import m2s from "mongoose-to-swagger";
const PORT = process.env.PORT || 8080;
const url = process.env.SERVER_URL || `localhost:${PORT}`;

const outputFile = "../swagger_output.json";
const endpointsFiles = ["../routers/*.ts"];

swaggerAutogen()(outputFile, endpointsFiles, {
  info: {
    title: "Task Manager API",
    version: "1.0.0",
  },
  definition: {
    User: m2s(User),
    Task: m2s(Task),
  },
  host: url,
  servers: [
    {
      url,
    },
  ],
})
  .then(() => {
    console.log("Swagger documentation generated successfully");
  })
  .catch((err: Error) => {
    console.error("Error generating Swagger documentation:", err);
  });
