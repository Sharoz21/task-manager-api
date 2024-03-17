import { NextFunction, Request, Response } from "express";
import AppError from "./utils/appError";

const express = require("express");
require("./db/mongoose");
const userRouter = require("./routers/userRouter");
const taskRouter = require("./routers/taskRouter");
const erroHandlingController = require("./controllers/errorController");

const app = express();

app.use(express.json());
app.use("/users", userRouter);
app.use("/tasks", taskRouter);

app.listen("8080", () => {
  console.log("Server started on port 8080!");
});

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  return next(
    new AppError(`The endpoint you have tried to access doesn't exist.`, 404)
  );
});

app.use(erroHandlingController);
