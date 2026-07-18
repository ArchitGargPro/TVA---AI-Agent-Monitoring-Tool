import { defineConfig } from "vitest/config";

export default defineConfig({
  css: {
    postcss: {
      plugins: [],
    },
  },
  test: {
    include: ["packages/*/src/**/*.test.ts", "packages/*/src/**/*.test.tsx"],
  },
});
