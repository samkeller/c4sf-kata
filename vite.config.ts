import { configDefaults, defineConfig } from 'vitest/config'
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
    // Les parcours E2E tournent avec Playwright (`npm run test:e2e`), pas avec Vitest.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // Restaure fetch, localStorage… après chaque test : un stub ne fuit jamais dans le suivant.
    unstubGlobals: true,
  },
}))
