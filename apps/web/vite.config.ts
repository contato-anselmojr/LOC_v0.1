import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  css: { postcss: {} }, // desativa leitura de arquivo externo
  server: { port: 5173 }
});
