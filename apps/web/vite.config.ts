import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ✅ Configuração com proxy para backend Express (porta 3000)
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
  css: { postcss: {} },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
