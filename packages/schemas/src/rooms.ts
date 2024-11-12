// We don't add validators here because rooms are created by the server not based on user-provided
// data, so no additional validation is required
import type { Question } from "./questions";

export interface NewRoom {
  userIds: [string, string];
  questionId: string;
}

interface SafeUser {
  isAdmin?: boolean | undefined;
  username: string;
  id: string;
  imageUrl: string;
}

export interface Room extends NewRoom {
  id: string;
  // This one is not serialisable, hence not included in responses. The ydoc is exclusively for use
  // by the Hocuspocus server only.
  // ydoc: Uint8Array | null;
  users: [SafeUser, SafeUser];
  question: Question;
  staledAt: Date | null;
  alreadyStale: boolean;
  createdAt: Date;
  updatedAt: Date;
}
