import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  define: {
    global: "globalThis",
  },
  build: {
    target: "es2022",
  },
});
