// We don't add validators here because rooms are created by the server not based on user-provided
// data, so no additional validation is required

export interface NewRoom {
  userIds: [string, string];
  questionId: string;
  code: string;
  language: string;
}

export interface Room extends NewRoom {
  id: string;
  // TODO: add ChatMessages etc here
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
