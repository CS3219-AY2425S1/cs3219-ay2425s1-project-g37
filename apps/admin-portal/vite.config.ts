import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), "") };
  return {
    plugins: [react()],
    server: { port: Number(process.env.PEERPREP_QUESTION_SPA_PORT) },
    resolve: { alias: { "~": "/src" } }, // Absolute path imports
  };
});