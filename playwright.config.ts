import { defineConfig, devices } from '@playwright/test'

// Port dédié : les tests ne tombent jamais sur un `npm run dev` lancé sur 5176.
const PORT = 5180

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
  webServer: {
    command: 'npm run build && npm run preview',
    env: { PORT: String(PORT) },
    url: `http://localhost:${PORT}`,
    timeout: 120_000,
  },
})
