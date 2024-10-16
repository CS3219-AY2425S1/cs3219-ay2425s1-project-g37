import { env } from "@peerprep/env";

export function getOrigin(
  service: "frontend" | "admin-portal" | "user" | "questions" | "matching",
) {
  switch (service) {
    case "frontend":
      return env.VITE_SELF_HOST
        ? "https://peerprep.joulev.dev"
        : `http://localhost:${env.VITE_PEERPREP_FRONTEND_PORT}`;
    case "admin-portal":
      return env.VITE_SELF_HOST
        ? "https://admin-peerprep.joulev.dev"
        : `http://localhost:${env.VITE_PEERPREP_QUESTION_SPA_PORT}`;
    case "user":
      return env.VITE_SELF_HOST
        ? "https://user-peerprep.joulev.dev"
        : `http://localhost:${env.VITE_USER_SERVICE_PORT}`;
    case "questions":
      return env.VITE_SELF_HOST
        ? "https://questions-peerprep.joulev.dev"
        : `http://localhost:${env.VITE_QUESTION_SERVICE_PORT}`;
    case "matching":
      return env.VITE_SELF_HOST
        ? "https://matching-peerprep.joulev.dev"
        : `http://localhost:${env.VITE_MATCHING_SERVICE_PORT}`;
  }
}
