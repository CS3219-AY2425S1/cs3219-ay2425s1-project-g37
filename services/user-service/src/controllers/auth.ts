import { db } from "@peerprep/db";
import { ExpectedError } from "@peerprep/utils/server";

export async function handleLogin(
  email: string | undefined,
  username: string | undefined,
  password: string,
  forceAdmin: boolean,
) {
  const GENERIC_ERROR = new ExpectedError("Invalid email or password");
  if (!email && !username) throw GENERIC_ERROR;

  const user = await db.user.findUnique({
    where: { email: email?.trim().toLowerCase(), username: username?.trim() },
    omit: { password: false },
  });
  if (!user) throw GENERIC_ERROR;

  const isValid = await Bun.password.verify(password, user.password);
  if (!isValid) throw GENERIC_ERROR;

  if (forceAdmin && !user.isAdmin) throw GENERIC_ERROR;

  return user.id;
}
