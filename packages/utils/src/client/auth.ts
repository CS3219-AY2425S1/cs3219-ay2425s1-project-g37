import type { NewUser, Room, UpdateUser, User } from "@peerprep/schemas";
import { userClient } from "@peerprep/utils/client";
import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";

const AUTH_KEY = "user:/auth/verify-token";

export function useAuth() {
  return useSWR(AUTH_KEY, userClient.swrFetcher<User | null>);
}

export function mutateAuth() {
  return mutate(AUTH_KEY);
}

export function useLogin(forceAdmin = false) {
  return useSWRMutation(
    AUTH_KEY,
    async (
      _,
      {
        arg: { emailOrUsername, password },
      }: { arg: { emailOrUsername: string; password: string } },
    ) => {
      const email = emailOrUsername.includes("@") ? emailOrUsername : undefined;
      const username = email ? undefined : emailOrUsername;
      await userClient.post("/auth/login", {
        json: { email, username, password, forceAdmin },
      });
    },
  );
}

export function useLogout() {
  return useSWRMutation(AUTH_KEY, () => userClient.post("/auth/logout"));
}

export function useRegister() {
  return useSWRMutation(AUTH_KEY, (_, { arg }: { arg: NewUser }) =>
    userClient.post("/users", { json: arg }),
  );
}

export function useUpdateUser(id: string) {
  return useSWRMutation(`users:/${id}`, async (_, { arg }: { arg: UpdateUser }) => {
    await userClient.patch(`/users/${id}`, { json: arg });
    mutateAuth();
  });
}

export function useUserHistory(id: string) {
  return useSWR(`users:/users/${id}/history`, userClient.swrFetcher<Room[]>);
}
