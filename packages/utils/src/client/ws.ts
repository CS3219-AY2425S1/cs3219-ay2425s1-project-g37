import { useState } from "react";
import useSWRSubscription, { type SWRSubscriptionOptions } from "swr/subscription";

export function useWsSubscription<SendPayload = unknown, ReceivePayload = unknown>(
  key: string,
  url: string = key,
) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const isReady = !!ws;
  const { data } = useSWRSubscription(
    key,
    (_, { next }: SWRSubscriptionOptions<ReceivePayload>) => {
      const ws = new WebSocket(url);
      setWs(ws);
      ws.addEventListener("message", event =>
        next(null, typeof event.data === "string" ? JSON.parse(event.data) : undefined),
      );
      ws.addEventListener("error", () => next("Connection error", undefined));
      return () => {
        if (ws.readyState === WebSocket.OPEN) ws.close();
        else ws.addEventListener("open", () => ws.close());
      };
    },
  );
  function send(data: SendPayload) {
    if (!isReady) return;
    ws.send(JSON.stringify(data));
  }
  return { isReady, data, send };
}
