import swaggerAutogen from "swagger-autogen";
import "dotenv/config";
import User from "../models/user";
import m2s from "mongoose-to-swagger";
const PORT = process.env.PORT || 8080;
const url = process.env.SERVER_URL || `localhost:${PORT}`;

const outputFile = "../swagger_output.json";
const endpointsFiles = ["../index.ts"];

swaggerAutogen()(outputFile, endpointsFiles, {
  info: {
    title: "Task Manager API",
    version: "1.0.0",
  },
  definition: {
    User: m2s(User),
    PublicUserInfo: { name: "John Doe", email: "johndoe@gmail.com" },
    Task: {
      _id: "65f4a2ebe558c9d2382e49f9",
      description: "sharozmalik30 Test Task 4",
      completed: false,
      owner: "65f331c94db4328a6acd5663",
      __v: 0,
    },
    TaskArray: [
      {
        _id: "65f4a2ebe558c9d2382e49f9",
        description: "sharozmalik30 Test Task 4",
        completed: false,
        owner: "65f331c94db4328a6acd5663",
        __v: 0,
      },
    ],
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
