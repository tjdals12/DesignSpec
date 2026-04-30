import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "#core/": path.resolve(__dirname, "src/core") + "/",
      "#utils/": path.resolve(__dirname, "src/utils") + "/",
      "#workflows/": path.resolve(__dirname, "src/workflows") + "/",
    },
  },
  test: {
    environment: "node",
    include: ["src/**/tests/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/tests/**"],
    },
  },
});
