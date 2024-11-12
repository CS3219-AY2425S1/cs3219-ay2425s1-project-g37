import { t } from "elysia";

export const id = t.String({ pattern: "^[a-f0-9]{24}$" });
