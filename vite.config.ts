import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    vue({
      // `/logo.svg` désigne un fichier de public/, servi tel quel : pas un module à importer.
      template: { transformAssetUrls: { includeAbsolute: false } },
    }),
    tailwindcss(),
  ],
  build: {
    copyPublicDir: !isSsrBuild,
  },
  test: {
    environment: 'node',
  },
}))
