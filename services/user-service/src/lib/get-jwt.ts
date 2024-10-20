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
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 1 month
    // Following properties are only applicable to self-hosting
    secure: env.VITE_SELF_HOST ? true : undefined,
    sameSite: env.VITE_SELF_HOST ? "none" : undefined,
    domain: env.VITE_SELF_HOST ? ".joulev.dev" : undefined,
  };
}
