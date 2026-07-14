import { defineConfig } from "cypress";

// E2E specs mock the API via cy.intercept, so no database is required to run
// them. The app pages still need to be served — run `npm run dev` first, or use
// `npm run e2e` which boots the dev server and runs Cypress headless.
export default defineConfig({
  viewportWidth: 390,
  viewportHeight: 844,
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.ts",
  },
});
