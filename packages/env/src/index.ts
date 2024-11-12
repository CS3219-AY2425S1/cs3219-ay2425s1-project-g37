import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// https://env.t3.gg/docs/core
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(1),
    ADMIN_SIGNUP_TOKEN: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1),
  },
  clientPrefix: "VITE_",
  client: {
    VITE_SELF_HOST: z
      .string()
      .optional()
      .transform(v => v === "true"),
  },
  runtimeEnv: import.meta.env, // Both Vite and Bun use `import.meta.env`
  emptyStringAsUndefined: true,
});
