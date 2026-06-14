import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";
import { sendError } from "../utils/errors.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, err.status, err.code, err.message, err.details);
  }

  console.error(err);
  return sendError(res, 500, "INTERNAL_ERROR", "Something went wrong");
}
