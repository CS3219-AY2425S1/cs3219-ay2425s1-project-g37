import { ExpectedError } from "@peerprep/utils/server";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleError(err: unknown, _: Request, res: Response, __: NextFunction) {
  if (err instanceof ExpectedError) return res.sendError(err.statusCode, err.message);
  return res.sendError(
    StatusCodes.INTERNAL_SERVER_ERROR,
    "Something went wrong. We messed up. Sorry",
  );
}
