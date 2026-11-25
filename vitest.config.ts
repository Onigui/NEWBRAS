import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/src/**/*.test.ts", "apps/*/src/**/*.test.{ts,tsx}"],
    environment: "node",
    // O banco mundial e os lotes de partidas levam alguns segundos na CI, que é mais lenta.
    testTimeout: 30_000,
  },
});
