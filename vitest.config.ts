import { mergeConfig } from "vitest/config";
import baseConfig from "./vitest.base.config.js";

export default mergeConfig(baseConfig, {
  test: {
    include: ["src/**/tests/*.test.ts"],
    exclude: ["src/**/tests/*.int-test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/tests/**"],
    },
  },
});
