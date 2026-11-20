import fs from 'node:fs/promises'
import express from 'express'
import helmet from 'helmet'
import type { ViteDevServer } from 'vite'
import type { LoadProductList } from '#shared/product-list.ts'
import type { RenderFn } from '#shared/ssr.ts'
import { productsRouter } from './api/products.ts'
import { getProductList } from './catalogue/catalogue.ts'
import { DUMMYJSON_IMAGE_ORIGIN } from './dummyjson/config.ts'

const isProduction = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT) || 5176
const base = process.env.BASE ?? '/'

// En production, le template est figé au build : on le lit une seule fois au démarrage.
const templateHtml = isProduction ? await fs.readFile('./dist/client/index.html', 'utf-8') : ''

const app = express()

app.use(
  helmet({
    contentSecurityPolicy: isProduction && {
      directives: {
        'img-src': ["'self'", 'data:', DUMMYJSON_IMAGE_ORIGIN],
        // PrimeVue injecte son thème en balises <style> (dans le HTML SSR puis au runtime).
        'style-src': ["'self'", "'unsafe-inline'"],
        // La démo tourne en HTTP local ; en production, HTTPS relève du reverse proxy.
        'upgrade-insecure-requests': null,
      },
    },
  }),
)

let vite: ViteDevServer | undefined
if (!isProduction) {
  const { createServer } = await import('vite')
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base,
  })
  app.use(vite.middlewares)
} else {
  const compression = (await import('compression')).default
  const sirv = (await import('sirv')).default
  app.use(compression())
  app.use(base, sirv('./dist/client', { extensions: [] }))
}

// Après `compression()` -> Avant le rendu SSR.
app.use('/api/products', productsRouter)

/**
 * En dev, Vite charge `entry-server.ts` à chaque requête pour profiter du HMR.
 * En prod, on importe le bundle SSR produit par `build:server`.
 */
async function loadRender(): Promise<RenderFn> {
  if (vite) {
    const module = (await vite.ssrLoadModule('/app/entry-server.ts')) as { render: RenderFn }
    return module.render
  }
  // Chemin calculé à l'exécution : le bundle n'existe qu'après le build.
  const bundle = new URL('../dist/server/entry-server.js', import.meta.url).href
  const module = (await import(bundle)) as { render: RenderFn }
  return module.render
}

/**
 * Le rendu appelle le catalogue directement, sans repasser par HTTP. Vue Query capte l'erreur
 * pour afficher l'état d'erreur : on la journalise ici, sinon elle n'apparaîtrait nulle part.
 */
const loadProductListForRender: LoadProductList = async (query) => {
  try {
    return await getProductList(query)
  } catch (error) {
    console.error(error)
    throw error
  }
}

async function loadTemplate(url: string): Promise<string> {
  if (!vite) return templateHtml
  // En dev, on relit index.html à chaque requête pour que ses modifications soient prises en compte.
  const template = await fs.readFile('./index.html', 'utf-8')
  return vite.transformIndexHtml(url, template)
}

app.use('*all', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '')
    const [template, render] = await Promise.all([loadTemplate(url), loadRender()])
    const rendered = await render(url, { loadProductList: loadProductListForRender })

    // Remplacements par fonction : avec une chaîne, `replace` interpréterait les `$&`, `$'`…
    // présents dans le contenu (un titre de produit, par exemple).
    const html = template
      .replace('<!--app-head-->', () => rendered.head)
      .replace('<!--app-html-->', () => rendered.html)
      .replace('<!--app-state-->', () => rendered.state)

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html)
  } catch (error: unknown) {
    if (error instanceof Error) vite?.ssrFixStacktrace(error)
    console.error(error)
    // La stack n'est renvoyée au navigateur qu'en dev, pour ne rien exposer en production.
    const body = !isProduction && error instanceof Error ? error.stack : 'Internal Server Error'
    res.status(500).end(body)
  }
})

app.listen(port, (error) => {
  if (error) throw error
  console.log(`Server started at http://localhost:${port}`)
})
