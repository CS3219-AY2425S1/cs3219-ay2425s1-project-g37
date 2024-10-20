import ky, { HTTPError, type Options } from "ky";
import { parse, stringify } from "superjson";

import type { ServiceResponseBodyError, ServiceResponseBodySuccess } from "../server";
import { getOrigin } from "./service-origins";

export function getHTTPErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong. Please try again.";
}

async function formatKyError(error: HTTPError): Promise<HTTPError> {
  const response = error.response;
  if (response) {
    const data = (await response.json()) as ServiceResponseBodyError;
    error.message = data.error;
  } else error.message = "Something went wrong. Please try again.";
  return error;
}

function createClient(baseUrl: string) {
  const kyClient = ky.create({
    prefixUrl: baseUrl,
    credentials: "include",
    hooks: { beforeError: [formatKyError] },
    headers: { "Content-Type": "application/superjson" },
    parseJson: parse,
    stringifyJson: stringify,
  });

  const methods = ["get", "post", "put", "delete", "patch", "head"] as const;
  // @ts-expect-error -- We will add the keys later
  const client: Record<
    (typeof methods)[number],
    <T>(url: string, options?: Options) => Promise<T>
  > & { swrFetcher: <T>(key: string) => Promise<T> } = {};

  for (const method of methods) {
    client[method] = async <T>(url: string, options?: Options): Promise<T> => {
      // We enforce a slash here so the syntax becomes userClient.get("/users") which is more
      // readable. ky's convention enforcing ky.get("users") makes sense but is not so intuitive.
      if (!url.startsWith("/")) throw new Error("url should start with a slash for consistency");
      const { data } = (await kyClient[method]<ServiceResponseBodySuccess<T>>(url.slice(1), {
        ...options,
        json: options?.json ?? (method === "get" || method === "head" ? undefined : {}),
      }).json()) as ServiceResponseBodySuccess<T>;
      return data;
    };
  }
  client.swrFetcher = async <T>(key: string) => {
    // SWR keys are global, so if we don't have the service identifier here, we could have the `/`
    // key representing the `/` route in two different microservices. To prevent that, we mandate
    // the use of the service identifier in the key, with a :.
    // Example: useSWR("questions:/abc") to get the route /abc of the questions microservice.
    if (!key.includes(":")) throw new Error("SWR key missing the service identifier");
    const url = key.split(":")[1];
    return client.get<T>(url);
  };
  return client;
}

export const userClient = createClient(getOrigin("user"));

export const questionsClient = createClient(getOrigin("questions"));

// Probably not needed since we use this service as a ws server
export const matchingClient = createClient(getOrigin("matching"));
