import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  css: { postcss: {} }, // desativa leitura de arquivo externo
  server: { port: 5173 }
});

