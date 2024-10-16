import { db } from "@peerprep/db";
import { env } from "@peerprep/env";
import type { Difficulty, NewRoom } from "@peerprep/schemas";
import { questions } from "@peerprep/schemas/validators";
import {
  ExpectedError,
  elysiaAuthPlugin,
  elysiaCorsPlugin,
  elysiaFormatResponsePlugin,
} from "@peerprep/utils/server";
import { Elysia, t } from "elysia";
import { StatusCodes } from "http-status-codes";

import { createRoom } from "./controllers/rooms";
import type { WorkerResponse } from "./worker";

async function getQuestionsFromFilter(difficulties: Difficulty[], tags: string[]) {
  const questions = await db.question.findMany({
    where: {
      difficulty: difficulties.length > 0 ? { in: difficulties } : undefined,
      tags: tags.length > 0 ? { hasSome: tags } : undefined,
    },
  });
  return questions;
}

const worker = new Worker(
  process.env.NODE_ENV === "production" ? "dist/worker.js" : "src/worker.ts",
);
worker.addEventListener("message", async ({ data }: { data: WorkerResponse }) => {
  switch (data.type) {
    case "success": {
      const roomData: NewRoom = {
        userIds: data.matched,
        questionId: data.questionId,
        code: "code () {}",
        language: "python",
      };

      try {
        const roomId = await createRoom(roomData);
        sendMessage(data.matched[0], {
          type: "success",
          matched: [data.matched[0], data.matched[1]],
          questionId: data.questionId,
          roomId: roomId,
        });
        sendMessage(data.matched[1], {
          type: "success",
          matched: [data.matched[0], data.matched[1]],
          questionId: data.questionId,
          roomId: roomId,
        });
      } catch (error) {
        console.error("Failed to create room:", error);
      }
      break;
    }
    case "timeout": {
      sendMessage(data.userId, { type: "timeout" });
      break;
    }
  }
});

const app = new Elysia()
  .use(elysiaCorsPlugin)
  .use(elysiaFormatResponsePlugin)
  .use(elysiaAuthPlugin)
  .get("/status", () => new Response("Online"))
  .ws("/", {
    body: t.Object({
      difficulties: t.Array(questions.difficultySchema),
      tags: t.Array(t.String({ minLength: 1 })),
    }),
    open(ws) {
      if (!ws.data.user) throw new ExpectedError("You must be logged in", StatusCodes.UNAUTHORIZED);
      ws.subscribe(ws.data.user.id);
    },
    async message(ws, { difficulties, tags }) {
      if (!ws.data.user) throw new ExpectedError("You must be logged in", StatusCodes.UNAUTHORIZED);
      const questions = await getQuestionsFromFilter(difficulties, tags);
      // TODO: if questions.length === 0, return an error via sendMessage
      worker.postMessage({
        type: "add",
        userId: ws.data.user.id,
        questionIds: questions.map(q => q.id),
      });
      sendMessage(ws.data.user.id, { type: "acknowledgement" });
    },
    close(ws) {
      if (!ws.data.user) throw new ExpectedError("You must be logged in", StatusCodes.UNAUTHORIZED);
      ws.unsubscribe(ws.data.user.id);
      worker.postMessage({ type: "remove", userId: ws.data.user.id });
    },
  })
  .listen(env.VITE_MATCHING_SERVICE_PORT);

function sendMessage(
  userId: string,
  message:
    | { type: "success"; matched: [string, string]; questionId: string; roomId: string }
    | { type: "acknowledgement" }
    | { type: "timeout" },
) {
  app.server?.publish(userId, JSON.stringify(message));
}

console.log(`Matching service is running at ${app.server?.hostname}:${app.server?.port}`);
