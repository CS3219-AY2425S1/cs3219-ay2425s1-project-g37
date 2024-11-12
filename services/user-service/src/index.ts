import { elysiaFormatResponsePlugin } from "@peerprep/utils/server";
import { Elysia } from "elysia";

import { authRoutes } from "~/routes/auth";
import { userRoutes } from "~/routes/users";

const app = new Elysia()
  .use(elysiaFormatResponsePlugin)
  .get("/status", () => new Response("Online"))
  .group("/users", app => app.use(userRoutes))
  .group("/auth", app => app.use(authRoutes))
  .listen(3000);

console.log(`User service is running at ${app.server?.hostname}:${app.server?.port}`);
