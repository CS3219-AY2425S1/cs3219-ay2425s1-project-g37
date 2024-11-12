import { Prisma, db } from "@peerprep/db";
import type { NewQuestion, Question, UpdateQuestion } from "@peerprep/schemas";
import { ExpectedError } from "@peerprep/utils/server";
import { StatusCodes } from "http-status-codes";

async function createQuestion(question: NewQuestion) {
  try {
    const existingQuestion = await db.question.findUnique({
      where: { leetCodeLink: question.leetCodeLink },
    });
    if (existingQuestion && !existingQuestion.deletedAt) return false;
    if (existingQuestion)
      await db.question.update({
        where: { id: existingQuestion.id },
        data: { ...question, deletedAt: null, createdAt: new Date() },
      });
    else await db.question.create({ data: question });
    return true;
  } catch {
    return false;
  }
}

export async function createQuestions(questions: NewQuestion | NewQuestion[]) {
  const questionsArray = Array.isArray(questions) ? questions : [questions];
  const result = await Promise.all(questionsArray.map(createQuestion));
  if (result.every(x => !x))
    throw new ExpectedError("All provided question(s) already exist", StatusCodes.CONFLICT);
  const countSuccess = result.filter(x => x).length;
  if (countSuccess === result.length) return "All questions successfully saved!";
  return `${countSuccess} question(s) saved, ${result.length - countSuccess} question(s) couldn't be saved due to conflicts`;
}

export async function getQuestion(id: string): Promise<Question> {
  const question = await db.question.findUnique({
    where: { id, OR: [{ deletedAt: { isSet: false } }, { deletedAt: { equals: null } }] },
  });
  if (!question) throw new ExpectedError("Question not found", StatusCodes.NOT_FOUND);
  return question;
}

export async function getAllQuestions(): Promise<Question[]> {
  return db.question.findMany({
    where: { OR: [{ deletedAt: { isSet: false } }, { deletedAt: { equals: null } }] },
    orderBy: { title: "asc" },
  });
}

export async function updateQuestion(id: string, question: UpdateQuestion) {
  try {
    await db.question.update({
      where: { id, OR: [{ deletedAt: { isSet: false } }, { deletedAt: { equals: null } }] },
      data: question,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new ExpectedError(
        "The question to be updated could not be found",
        StatusCodes.NOT_FOUND,
      );
    throw error;
  }
}

export async function deleteQuestion(id: string, opts?: { dangerouslyHardDelete?: boolean }) {
  try {
    if (opts?.dangerouslyHardDelete) await db.question.delete({ where: { id } });
    else await db.question.update({ where: { id }, data: { deletedAt: new Date() } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")
      throw new ExpectedError(
        "The question to be deleted could not be found",
        StatusCodes.NOT_FOUND,
      );
    throw error;
  }
}
