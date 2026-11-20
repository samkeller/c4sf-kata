import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [vue()],
  build: {
    copyPublicDir: !isSsrBuild,
  },
  test: {
    environment: 'node',
  },
}))
