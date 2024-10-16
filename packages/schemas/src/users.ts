import { type Static, t } from "elysia";

import { id } from "./validate-id";

const baseSchema = t.Object({
  username: t.String({ minLength: 4, maxLength: 32, pattern: "^[a-zA-Z0-9_]{4,32}$" }),
  email: t.String({ format: "email" }),
  isAdmin: t.Optional(t.Boolean()),
});

const baseSchemaWithPassword = t.Intersect([
  baseSchema,
  t.Object({ password: t.String({ minLength: 8, maxLength: 128 }) }),
]);

export const createSchema = t.Intersect([
  baseSchemaWithPassword,
  t.Object({ adminSignUpToken: t.Optional(t.String()) }),
]);
export type NewUser = Static<typeof createSchema>;

export const updateSchema = t.Partial(baseSchemaWithPassword);
export type UpdateUser = Static<typeof updateSchema>;

export const schema = t.Intersect([
  baseSchema,
  t.Object({
    id,
    password: t.Optional(t.Never()),
    createdAt: t.Date(),
    updatedAt: t.Date(),
    imageUrl: t.String(),
  }),
]);
export type User = Static<typeof schema>;
