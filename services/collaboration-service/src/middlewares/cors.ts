import { env } from "@peerprep/env";
import cors from "cors";

export const corsMiddleware = cors({
  origin: [
    `http://localhost:${env.VITE_PEERPREP_FRONTEND_PORT}`,
    `http://localhost:${env.VITE_PEERPREP_QUESTION_SPA_PORT}`,
    /^https?:\/\/(\w+-)?peerprep\.joulev\.dev.*$/,
  ],
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD"],
});
