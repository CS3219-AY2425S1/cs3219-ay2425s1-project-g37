import { id, users } from "@peerprep/schemas/validators";
import { ExpectedError, elysiaAuthPlugin } from "@peerprep/utils/server";
import { Elysia, t } from "elysia";
import { StatusCodes } from "http-status-codes";

import {
  createUser,
  deleteUser,
  getAllUsers,
  getUser,
  updateUser,
  updateUserPrivilege,
} from "~/controllers/users";
import { getJwt } from "~/lib/get-jwt";

const adminRoutes = new Elysia()
  .use(elysiaAuthPlugin)
  .onBeforeHandle(({ user }) => {
    if (!user?.isAdmin)
      throw new ExpectedError("Only admins can perform this action", StatusCodes.UNAUTHORIZED);
  })
  .get("/", () => getAllUsers())
  .patch("/:id/privilege", ({ params, body }) => updateUserPrivilege(params.id, body.isAdmin), {
    body: t.Object({ isAdmin: t.Boolean() }),
    params: t.Object({ id }),
  });

const protectedRoutes = new Elysia({ prefix: "/:id" })
  .use(elysiaAuthPlugin)
  .guard({ params: t.Object({ id }) })
  .onBeforeHandle(({ user, params }) => {
    if (user?.id !== params.id && !user?.isAdmin)
      throw new ExpectedError("You may not perform this action", StatusCodes.UNAUTHORIZED);
  })
  .get("/", ({ params }) => getUser(params.id))
  .patch("/", ({ params, body }) => updateUser(params.id, body), { body: users.updateSchema })
  .delete("/", ({ params }) => deleteUser(params.id));

const publicRoutes = new Elysia().use(elysiaAuthPlugin).post(
  "/",
  async ({ jwt, body, cookie: { auth_token } }) => {
    const id = await createUser(body);
    auth_token.set(await getJwt(id, jwt.sign));
  },
  { body: users.createSchema },
);

export const userRoutes = new Elysia().use(adminRoutes).use(protectedRoutes).use(publicRoutes);
