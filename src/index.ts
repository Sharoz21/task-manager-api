import { NextFunction, Request, Response } from "express";
import * as swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "./swagger_output.json";
import "dotenv/config";
import AppError from "./utils/appError";

const express = require("express");
require("./db/mongoose");

const userRouter = require("./routers/userRouter");
const taskRouter = require("./routers/taskRouter");
const erroHandlingController = require("./controllers/errorController");

const app = express();
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());
app.use("/users", userRouter);
app.use("/tasks", taskRouter);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}!`);
});

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  return next(
    new AppError(`The endpoint you have tried to access doesn't exist.`, 404)
  );
});

app.use(erroHandlingController);
