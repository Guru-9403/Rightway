import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Lesson videos (/courses-videos/N.mp4) are served by the backend in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/courses-videos": "http://127.0.0.1:5500",
    },
  },
});
