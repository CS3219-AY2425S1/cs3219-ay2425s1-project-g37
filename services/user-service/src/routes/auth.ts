import type { User } from "@peerprep/schemas";
import { elysiaAuthPlugin } from "@peerprep/utils/server";
import Elysia, { t } from "elysia";

import { handleLogin } from "~/controllers/auth";
import { getJwt } from "~/lib/get-jwt";

export const authRoutes = new Elysia()
  .use(elysiaAuthPlugin)
  .post(
    "/login",
    async ({ jwt, body: { email, username, password, forceAdmin }, cookie: { auth_token } }) => {
      const id = await handleLogin(email, username, password, Boolean(forceAdmin));
      auth_token.set(await getJwt(id, jwt.sign));
    },
    {
      body: t.Object({
        email: t.Optional(t.String({ format: "email" })),
        username: t.Optional(t.String({ pattern: "^[a-zA-Z0-9_]{4,32}$" })),
        password: t.String({ minLength: 8, maxLength: 128 }),
        forceAdmin: t.Optional(t.Boolean()),
      }),
    },
  )
  .post("/logout", async ({ cookie: { auth_token } }) => auth_token.remove())
  .get("/verify-token", ({ user }): User | null => user);
