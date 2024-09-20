import cors from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { db } from "@peerprep/db";
import { env } from "@peerprep/env";
import Elysia from "elysia";
import { StatusCodes } from "http-status-codes";

// Error intentionally thrown in the code, indicating a user fault, not a code bug
// To display a user-friendly error message to the user, compared to a generic "something went wrong"
// We can differentiate errors with `instanceof`
export class ExpectedError extends Error {
  statusCode: StatusCodes;

  constructor(message: string, statusCode?: StatusCodes) {
    super(message);
    this.statusCode = statusCode || StatusCodes.BAD_REQUEST;
    this.name = "ExpectedError";
  }
}

export type ServiceResponseBody<T = unknown> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string };

class ServiceResponse<T = unknown> extends Response {
  constructor(body: ServiceResponseBody<T>, init?: ResponseInit) {
    super(JSON.stringify(body), init);
  }
}

export const elysiaCorsPlugin = new Elysia({ name: "cors" }).use(
  cors({
    origin: [
      `http://localhost:${env.VITE_PEERPREP_FRONTEND_PORT}`,
      `http://localhost:${env.VITE_PEERPREP_QUESTION_SPA_PORT}`,
    ],
  }),
);

export const elysiaFormatResponsePlugin = new Elysia({ name: "handle-error" })
  .error({ ExpectedError })
  .onError({ as: "global" }, ({ code, error }) => {
    switch (code) {
      case "ExpectedError":
        return new ServiceResponse(
          { success: false, error: error.message },
          { status: error.statusCode },
        );
      case "NOT_FOUND":
        return new ServiceResponse(
          { success: false, error: "Not found" },
          { status: error.status },
        );
      case "VALIDATION":
      case "PARSE":
        return new ServiceResponse(
          { success: false, error: "Invalid request body" },
          { status: error.status },
        );
      default:
        return new ServiceResponse(
          { success: false, error: "Something went wrong. We messed up. Sorry" },
          { status: StatusCodes.INTERNAL_SERVER_ERROR },
        );
    }
  })
  .mapResponse({ as: "global" }, ({ response }) => {
    // If it's already a Response instance, it's already ready to be shipped, we don't touch it anymore
    if (response instanceof Response) return response;
    // Else we shape it to a valid JSON so the frontend can retrieve
    return new ServiceResponse({ success: true, data: response });
  });

export const elysiaAuthPlugin = new Elysia({ name: "check-auth" })
  .use(jwt({ name: "jwt", secret: env.JWT_SECRET }))
  .derive({ as: "scoped" }, async ({ jwt, cookie: { auth_token } }) => {
    if (!auth_token) return { user: null };

    const result = await jwt.verify(auth_token.value);
    if (!result) return { user: null };

    const id = result.sub;
    if (!id) return { user: null };

    const user = await db.user.findUnique({ where: { id } });
    return { user };
  });
