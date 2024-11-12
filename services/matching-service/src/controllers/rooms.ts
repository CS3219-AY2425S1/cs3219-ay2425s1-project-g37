import { db } from "@peerprep/db";
import type { NewRoom } from "@peerprep/schemas";

export async function createRoom(room: NewRoom) {
  // No need error handling here because the data provided is from the backend so need not be validated (hopefully)
  const createdRoom = await db.room.create({ data: room });
  return createdRoom.id;
}
