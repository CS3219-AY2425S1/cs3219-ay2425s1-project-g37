import type { NextFunction, Request, Response } from "express";
import type { StatusCodes } from "http-status-codes";
import { stringify } from "superjson";

export function formatResponse(_: Request, res: Response, next: NextFunction) {
  // Handle response SuperJSON formatting only. Request formatting can be implemented if needed.
  res.superjson = function (data) {
    this.setHeader("Content-Type", "application/superjson");
    this.send(stringify({ success: true, data }));
  };
  res.sendError = function (status: StatusCodes, message: string) {
    this.setHeader("Content-Type", "application/superjson");
    this.status(status);
    this.send(stringify({ success: false, error: message }));
  };
  next();
}
