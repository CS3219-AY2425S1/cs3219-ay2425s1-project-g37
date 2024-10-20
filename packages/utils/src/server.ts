import cors from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { db } from "@peerprep/db";
import { env } from "@peerprep/env";
import type { User } from "@peerprep/schemas";
import Elysia from "elysia";
import { StatusCodes } from "http-status-codes";
import { parse, stringify } from "superjson";

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

export type ServiceResponseBodySuccess<T = unknown> = { success: true; data: T; error?: never };
export type ServiceResponseBodyError = { success: false; data?: never; error: string };
export type ServiceResponseBody<T = unknown> =
  | ServiceResponseBodySuccess<T>
  | ServiceResponseBodyError;

class ServiceResponse<T = unknown> extends Response {
  constructor(body: ServiceResponseBody<T>, init?: ResponseInit) {
    super(stringify(body), {
      ...init,
      headers: { ...init?.headers, "Content-Type": "application/superjson" },
    });
  }
}

export const elysiaCorsPlugin = new Elysia({ name: "cors" }).use(
  cors({
    origin: [
      `http://localhost:${env.VITE_PEERPREP_FRONTEND_PORT}`,
      `http://localhost:${env.VITE_PEERPREP_QUESTION_SPA_PORT}`,
      `http://localhost:${env.VITE_MATCHING_SERVICE_PORT}`,
      /^https?:\/\/(\w+-)?peerprep\.joulev\.dev.*$/,
    ],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD"],
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
        console.error(error);
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
  })
  .onParse({ as: "global" }, async ({ request, contentType }) => {
    if (contentType === "application/superjson") return parse(await request.text());
  });

export function decorateUser(user: Omit<User, "imageUrl">): User {
  return {
    ...user,
    imageUrl: `https://www.gravatar.com/avatar/${new Bun.CryptoHasher("sha256").update(user.email.toLowerCase()).digest("hex")}?d=identicon&size=256`,
  };
}

export const elysiaAuthPlugin = new Elysia({ name: "check-auth" })
  .use(jwt({ name: "jwt", secret: env.JWT_SECRET }))
  .derive({ as: "scoped" }, async ({ jwt, cookie: { auth_token } }) => {
    if (!auth_token) return { user: null };

    const result = await jwt.verify(auth_token.value);
    if (!result) return { user: null };

    const id = result.sub;
    if (!id) return { user: null };

    const user = await db.user.findUnique({ where: { id } });
    return { user: user ? decorateUser(user) : null };
  });
