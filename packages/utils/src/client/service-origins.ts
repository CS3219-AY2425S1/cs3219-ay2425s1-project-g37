import { env } from "@peerprep/env";

export function getOrigin(
  service: "frontend" | "admin-portal" | "user" | "questions" | "matching" | "collaboration",
) {
  const baseDomain = env.VITE_SELF_HOST ? "https://peerprep.joulev.dev" : "http://localhost:3000";
  switch (service) {
    case "frontend":
      return baseDomain;
    case "admin-portal":
      return `${baseDomain}/admin`;
    case "user":
      return `${baseDomain}/api/user`;
    case "questions":
      return `${baseDomain}/api/questions`;
    case "matching":
      return `${baseDomain}/api/matching`;
    case "collaboration":
      return `${baseDomain}/api/collaboration`;
  }
}
