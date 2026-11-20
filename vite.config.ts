import { configDefaults, defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    vue({
      // `/logo.svg` désigne un fichier de public/, servi tel quel : pas un module à importer.
      template: { transformAssetUrls: { includeAbsolute: false } },
    }),
    tailwindcss(),
    // `npm run analyze` : carte du bundle client dans dist/stats.html.
    process.env.ANALYZE ? visualizer({ filename: 'dist/stats.html', gzipSize: true }) : null,
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
