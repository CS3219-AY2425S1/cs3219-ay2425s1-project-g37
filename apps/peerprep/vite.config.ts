import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), "") };
  return {
    plugins: [react()],
    server: { host: "0.0.0.0", port: 3000, strictPort: true },
    preview: { host: "0.0.0.0", port: 3000, strictPort: true },
    resolve: { alias: { "~": "/src" } }, // Absolute path imports
  };
});
