import { StatusCodes } from "http-status-codes";

type StatusCode = StatusCodes;

export default class AppError extends Error {
  statusCode: StatusCode;
  status: string;
  isOperational: boolean;
  constructor(message: string, statusCode: StatusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
