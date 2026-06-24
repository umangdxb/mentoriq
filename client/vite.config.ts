import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/generate": "http://localhost:3000",
      "/grade": "http://localhost:3000",
      "/seeds": "http://localhost:3000",
      "/eval": "http://localhost:3000",
      "/health": "http://localhost:3000",
    },
  },
});
