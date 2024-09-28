import { type Static, t } from "elysia";

import { id } from "./validate-id";

export const difficultySchema = t.Union([
  t.Literal("EASY"),
  t.Literal("MEDIUM"),
  t.Literal("HARD"),
]);
export type Difficulty = Static<typeof difficultySchema>;

export const createSchema = t.Object({
  title: t.String({ minLength: 1, maxLength: 128 }),
  content: t.String({ minLength: 1, maxLength: 65536 }),
  difficulty: difficultySchema,
  tags: t.Array(t.String()),
  leetCodeLink: t.String(),
});
export type NewQuestion = Static<typeof createSchema>;

export const updateSchema = t.Partial(createSchema);
export type UpdateQuestion = Static<typeof updateSchema>;

export const schema = t.Intersect([
  createSchema,
  t.Object({
    id,
    createdAt: t.Optional(t.Date()),
    updatedAt: t.Optional(t.Date()),
  }),
]);
export type Question = Static<typeof schema>;
