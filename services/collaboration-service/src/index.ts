import { Database } from "@hocuspocus/extension-database";
import { Server } from "@hocuspocus/server";
import { ExpectedError } from "@peerprep/utils/server";
import express from "express";
import "express-async-errors";
import expressWebsockets from "express-ws";
import { StatusCodes } from "http-status-codes";
import { nanoid } from "nanoid";
import * as Y from "yjs";

import { getCompletion } from "~/controllers/ai";
import { checkRoomAccessibility } from "~/controllers/auth";
import {
  getRoom,
  getYDocFromRoom,
  makeRoomActiveAgain,
  scheduleRoomForInactivity,
  storeYDocToRoom,
} from "~/controllers/rooms";
import { formatResponse } from "~/middlewares/format-response";
import { handleError } from "~/middlewares/handle-error";

type StatelessMessage = { type: "chat"; userId: string } | { type: "ai" };

const server = Server.configure({
  onAuthenticate: async ({ request, documentName, connection }) => {
    const roomPromise = getRoom(documentName);
    const result = await checkRoomAccessibility(request, roomPromise);
    if (!result.user || !result.accessible)
      throw new ExpectedError("Unauthorized", StatusCodes.UNAUTHORIZED);
    const room = await roomPromise;
    if (room.alreadyStale) connection.readOnly = true;
    return { user: result.user };
  },
  onStateless: async ({ document, documentName, payload }) => {
    const data: StatelessMessage = JSON.parse(payload);
    if (data.type === "chat") return document.broadcastStateless(payload);
    if (data.type === "ai") {
      const room = await getRoom(documentName);
      const activeLanguage = document.getText("language").toString();
      const code = document.getText("monaco").toString().trim();
      const yAIChatMessages = document.getArray<Y.Map<string>>("aIChatMessages");
      const aiResponse = await getCompletion(room, activeLanguage, code, yAIChatMessages);
      document.transact(() => {
        const yChatMessage = new Y.Map<string>();
        yChatMessage.set("id", nanoid());
        yChatMessage.set("userId", "ai");
        yChatMessage.set("timestamp", new Date().toISOString());
        yChatMessage.set("content", aiResponse);
        yAIChatMessages.push([yChatMessage]);
      });
    }
  },
  afterLoadDocument: ({ documentName }) => makeRoomActiveAgain(documentName),
  afterUnloadDocument: ({ documentName }) => scheduleRoomForInactivity(documentName),
  extensions: [
    new Database({
      fetch: ({ documentName }) => getYDocFromRoom(documentName),
      store: ({ documentName, state }) => storeYDocToRoom(documentName, state),
    }),
  ],
});

const { app } = expressWebsockets(express());

app.use(formatResponse);

app.get("/status", (_, res) => void res.send("Online"));

app.get("/rooms/:id", async (req, res) => {
  const roomPromise = getRoom(req.params.id);
  const result = await checkRoomAccessibility(req, roomPromise);
  if (result.user && result.accessible) return void res.superjson(await roomPromise);
  throw new ExpectedError("Unauthorized", StatusCodes.UNAUTHORIZED);
});

app.ws("/collab/:id", (ws, req) => server.handleConnection(ws, req));

app.use(handleError);

app.listen(3000, () => console.log("Collaboration service is running"));
