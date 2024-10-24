import type { Room } from "@peerprep/schemas";
import { collaborationClient } from "@peerprep/utils/client";
import useSWR from "swr";

export function useRoom(id: string) {
  return useSWR(`rooms:/rooms/${id}`, collaborationClient.swrFetcher<Room>);
}
