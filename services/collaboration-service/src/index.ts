import { Database } from "@hocuspocus/extension-database";
import { Server } from "@hocuspocus/server";
import { env } from "@peerprep/env";
import { ExpectedError } from "@peerprep/utils/server";
import express from "express";
import "express-async-errors";
import expressWebsockets from "express-ws";
import { StatusCodes } from "http-status-codes";

import { checkRoomAccessibility } from "~/controllers/auth";
import { getRoom, getYDocFromRoom, storeYDocToRoom } from "~/controllers/rooms";
import { corsMiddleware } from "~/middlewares/cors";
import { formatResponse } from "~/middlewares/format-response";
import { handleError } from "~/middlewares/handle-error";

const server = Server.configure({
  onAuthenticate: async ({ request, documentName }) => {
    const result = await checkRoomAccessibility(request, getRoom(documentName));
    if (!result.user || !result.accessible)
      throw new ExpectedError("Unauthorized", StatusCodes.UNAUTHORIZED);
    return { user: result.user };
  },
  extensions: [
    new Database({
      fetch: ({ documentName }) => getYDocFromRoom(documentName),
      store: ({ documentName, state }) => storeYDocToRoom(documentName, state),
    }),
  ],
});

const { app } = expressWebsockets(express());

app.use(corsMiddleware);
app.use(formatResponse);

app.get("/status", (_, res) => void res.send("Online"));

app.get("/rooms/:id", async (req, res) => {
  const roomPromise = getRoom(req.params.id);
  const result = await checkRoomAccessibility(req, roomPromise);
  if (result.user && result.accessible) return void res.superjson(await roomPromise);
  throw new ExpectedError("Unauthorized", StatusCodes.UNAUTHORIZED);
});

app.ws("/", (ws, req) => server.handleConnection(ws, req));

app.use(handleError);

app.listen(env.VITE_COLLABORATION_SERVICE_PORT, () => {
  console.log(
    `Collaboration service is running at localhost:${env.VITE_COLLABORATION_SERVICE_PORT}`,
  );
});
