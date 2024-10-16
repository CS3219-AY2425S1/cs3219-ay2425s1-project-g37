import type { Static, TSchema } from "elysia";
import { TypeCompiler } from "elysia/type-system";

export { t } from "elysia";
export { id } from "./validate-id";
export * as questions from "./questions";
export * as users from "./users";

export function validate<T extends TSchema>(
  schema: T,
  data: unknown,
): { data: Static<T>; success: true } | { data: null; success: false } {
  const compiled = TypeCompiler.Compile(schema);
  const checkResult = compiled.Check(data);
  if (checkResult) return { data: data as Static<T>, success: true };
  return { data: null, success: false };
}
