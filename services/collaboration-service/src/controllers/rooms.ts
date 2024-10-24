import { db } from "@peerprep/db";
import type { Room, User } from "@peerprep/schemas";
import { ExpectedError, decorateUser } from "@peerprep/utils/server";
import { StatusCodes } from "http-status-codes";

// /**
//  * The `decorateUser` from `@peerprep/utils/server` only runs on Bun
//  */
// function decorateUser(user: Omit<User, "imageUrl">): User {
//   return {
//     ...user,
//     imageUrl: `https://www.gravatar.com/avatar/${new Bun.CryptoHasher("sha256").update(user.email.toLowerCase()).digest("hex")}?d=identicon&size=256`,
//   };
// }

function stripUser({ id, imageUrl, isAdmin, username }: User) {
  return { id, imageUrl, isAdmin, username };
}

export async function getRoom(roomId: string): Promise<Room> {
  if (roomId.length !== 24) throw new ExpectedError("Invalid room ID", StatusCodes.BAD_REQUEST);
  const room = await db.room.findUnique({
    where: { id: roomId },
    include: { users: true, question: true },
  });
  if (!room) throw new ExpectedError("Room not found", StatusCodes.NOT_FOUND);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { userIds, users, ydoc, ...rest } = room;
  if (userIds.length !== 2 || users.length !== 2)
    throw new Error("invariant: Room must have exactly 2 users");
  return {
    ...rest,
    userIds: [userIds[0], userIds[1]],
    users: [stripUser(decorateUser(users[0])), stripUser(decorateUser(users[1]))],
  };
}

export async function getYDocFromRoom(roomId: string): Promise<Uint8Array | null> {
  const room = await db.room.findUnique({ where: { id: roomId } });
  // This should only be run when the user has already accessed the room and the room is valid
  if (!room) throw new Error("invariant: The room cannot be found in the database");
  return room.ydoc;
}

export async function storeYDocToRoom(roomId: string, ydoc: Uint8Array) {
  await db.room.update({ where: { id: roomId }, data: { ydoc: Buffer.from(ydoc) } });
}
