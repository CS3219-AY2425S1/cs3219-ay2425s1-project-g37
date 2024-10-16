import { type Static, t } from "elysia";

import { id } from "./validate-id";

export const chatMessageSchema = t.Object({
  id: t.String({ format: "objectId" }),
  userId: id,
  roomId: id,
  content: t.String({ minLength: 1 }),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  deletedAt: t.Optional(t.Date()),
});
export type ChatMessage = Static<typeof chatMessageSchema>;

export const createRoomSchema = t.Object({
  userIds: t.Array(id, { minItems: 1 }),
  questionId: id,
  code: t.String({ minLength: 1 }),
  language: t.String({ minLength: 1 }),
});
export type NewRoom = Static<typeof createRoomSchema>;

export const updateRoomSchema = t.Partial(
  t.Object({
    code: t.String({ minLength: 1 }),
    language: t.String({ minLength: 1 }),
    chatMessages: t.Array(chatMessageSchema),
  }),
);
export type UpdateRoom = Static<typeof updateRoomSchema>;

export const roomSchema = t.Intersect([
  createRoomSchema,
  t.Object({
    id,
    createdAt: t.Date(),
    updatedAt: t.Date(),
    deletedAt: t.Optional(t.Date()),
  }),
]);
export type Room = Static<typeof roomSchema>;
