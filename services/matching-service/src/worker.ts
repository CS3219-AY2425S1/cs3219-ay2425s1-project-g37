import { z } from "zod";

declare const self: Worker;

const TIMEOUT_IN_SECONDS = 20;

const taskSchema = z
  .object({ type: z.literal("add"), userId: z.string(), questionIds: z.string().array() })
  .or(z.object({ type: z.literal("remove"), userId: z.string() }));
type Task = z.infer<typeof taskSchema>;

export type WorkerResponse =
  | { type: "timeout"; userId: string }
  | { type: "success"; matched: [string, string]; questionId: string; roomId: string };

function publish(response: WorkerResponse) {
  self.postMessage(response);
}

class MatchmakingQueue {
  // questionId -> Set<userId>
  private questionMap: Map<string, Set<string>> = new Map();
  // userId -> questionId[]
  private userMap: Map<string, { addedTime: Date; questions: string[] }> = new Map();

  remove(userId: string) {
    const data = this.userMap.get(userId);
    if (data) {
      for (const questionId of data.questions) {
        const userList = this.questionMap.get(questionId);
        if (userList) userList.delete(userId);
      }
    }
    this.userMap.delete(userId);
  }

  enqueue(
    userId: string,
    questionIds: string[],
  ): { matchedUserId: string; matchedQuestionId: string } | null {
    const previousQuestionIds = this.userMap.get(userId);
    if (previousQuestionIds) this.remove(userId);

    for (const questionId of questionIds) {
      const userIds = this.questionMap.get(questionId);
      if (!userIds || userIds.size <= 0) continue;
      const [firstId] = userIds;
      if (!firstId) continue;
      // Match first with user.id
      this.remove(firstId);
      // User is already matched so we need not enqueue them
      return { matchedUserId: firstId, matchedQuestionId: questionId };
    }
    // Couldn't match on any questions so we enqueue them
    this.userMap.set(userId, { addedTime: new Date(), questions: questionIds });
    for (const questionId of questionIds) {
      const userIds = this.questionMap.get(questionId) ?? new Set();
      userIds.add(userId);
      this.questionMap.set(questionId, userIds);
    }
    return null;
  }

  checkTimeout() {
    const now = new Date();
    for (const [userId, { addedTime }] of this.userMap) {
      if (now.getTime() - addedTime.getTime() > TIMEOUT_IN_SECONDS * 1000) {
        this.remove(userId);
        publish({ type: "timeout", userId });
      }
    }
  }
}

const taskQueue: Task[] = [];
const matchmakingQueue = new MatchmakingQueue();

async function processTasks() {
  while (true) {
    matchmakingQueue.checkTimeout();

    if (taskQueue.length <= 0) await new Promise(resolve => setTimeout(resolve, 0)); // Yield control back to main thread

    const task = taskQueue.shift();
    if (!task) continue;

    switch (task.type) {
      case "add": {
        const result = matchmakingQueue.enqueue(task.userId, task.questionIds);
        if (result) {
          publish({
            type: "success",
            matched: [task.userId, result.matchedUserId],
            questionId: result.matchedQuestionId,
            roomId: "",
          });
        }
        break;
      }
      case "remove": {
        matchmakingQueue.remove(task.userId);
        break;
      }
    }
  }
}

self.addEventListener("message", ({ data }) => {
  const parseResult = taskSchema.safeParse(data);
  if (!parseResult.success) return console.error("Invalid message sent to matching queue worker");
  taskQueue.push(parseResult.data);
});
processTasks();
console.log("Matching service worker is ready");
