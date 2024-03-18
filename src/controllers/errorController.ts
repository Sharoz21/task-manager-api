import { Request, Response, NextFunction } from "express";
import AppError from "./../utils/appError";
import { MongooseError } from "mongoose";
import { AppErrorType } from "../constants";
import { IErrorRequest, IErrorResponse } from "../types";

// mongoose doesn't provide an error types for following properties
interface CustomMongooseError extends MongooseError {
  path?: string;
  value?: string | number;
  errors?: string[];
  code?: number;
}

const handleCastErrorDB = (err: CustomMongooseError) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: CustomMongooseError) => {
  const message = `Duplicate field value: ${err?.message}.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: CustomMongooseError) => {
  const errors = Object.values(err.errors || {}).map((el) => el as any);

  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError("Invalid Token", 401);

const handleJWTExpiredError = () => new AppError("Expired Token.", 401);

const sendErrorResponse = (
  err: InstanceType<typeof AppError>,
  req: Request,
  res: Response
) => {
  // send from within the code
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // undetectable error
  return res.status(500).json({
    status: "error",
    message: "Something went very wrong!",
  });
};

module.exports = (
  err: InstanceType<typeof AppError>,
  req: IErrorRequest,
  res: IErrorResponse,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  let error = { ...err };
  error.message = err.message;

  if (error.name === AppErrorType.CastError)
    error = handleCastErrorDB(error as MongooseError);
  if ((error as CustomMongooseError).code === 11000)
    error = handleDuplicateFieldsDB(error as MongooseError);
  if (error.name === AppErrorType.ValidationError)
    error = handleValidationErrorDB(error as MongooseError);
  if (error.name === AppErrorType.jwtInvalid) error = handleJWTError();
  if (error.name === AppErrorType.jwtExpired) error = handleJWTExpiredError();

  sendErrorResponse(error, req, res);
};
