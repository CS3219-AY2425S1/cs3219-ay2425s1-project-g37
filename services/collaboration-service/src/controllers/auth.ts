import { db } from "@peerprep/db";
import { env } from "@peerprep/env";
import type { Room } from "@peerprep/schemas";
import cookie from "cookie";
import type { IncomingMessage } from "http";
import { verify } from "jsonwebtoken";

export async function checkRoomAccessibility(req: IncomingMessage, roomPromise: Promise<Room>) {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies["auth_token"];
    if (!token) throw new Error();
    const decoded = verify(token, env.JWT_SECRET);
    const id = decoded.sub;
    if (!id || typeof id !== "string") throw new Error();
    const [user, room] = await Promise.all([db.user.findUnique({ where: { id } }), roomPromise]);
    return { user, accessible: room.userIds.includes(id) };
  } catch {
    return { user: null, accessible: false };
  }
}
