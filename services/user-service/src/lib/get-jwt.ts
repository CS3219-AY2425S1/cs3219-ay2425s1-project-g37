import type { JWTPayloadSpec } from "@elysiajs/jwt";
import { env } from "@peerprep/env";
import type { ElysiaCookie } from "elysia/cookies";

export async function getJwt(
  id: string,
  sign: (morePayload: Record<string, string | number> & JWTPayloadSpec) => Promise<string>,
): Promise<Partial<ElysiaCookie>> {
  return {
    value: await sign({ sub: id }),
    httpOnly: true,
    secure: env.VITE_SELF_HOST,
    sameSite: "none",
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 1 month
    domain: env.VITE_SELF_HOST ? ".joulev.dev" : undefined,
  };
}
