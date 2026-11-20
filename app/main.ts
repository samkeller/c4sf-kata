import { createSSRApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { VueQueryPlugin } from '@tanstack/vue-query'
import type { LoadProductList } from '#shared/product-list.ts'
import App from './App.vue'
import './style.css'
import { loadProductListKey } from './products/state/use-product-list.ts'
import { createQueryClient } from './query-client.ts'

/**
 * Une instance par requête : côté serveur, un état partagé fuiterait d'un utilisateur à l'autre.
 *
 * @param loadProductList source des produits, propre à chaque côté (serveur ou navigateur).
 */
export function createApp(loadProductList: LoadProductList) {
  const app = createSSRApp(App)
  const queryClient = createQueryClient()

  app.use(PrimeVue, {
    theme: {
      preset: Aura,
      // Thème clair uniquement : sans ça, Aura suit le mode sombre du système
      // alors que le reste de la page reste clair.
      options: {
        darkModeSelector: 'none',
        // Couche placée avant les utilitaires Tailwind, pour qu'une classe posée sur un
        // composant PrimeVue l'emporte sur son style par défaut.
        cssLayer: { name: 'primevue', order: 'theme, base, primevue' },
      },
    },
  })
  app.use(VueQueryPlugin, { queryClient })
  app.provide(loadProductListKey, loadProductList)

  return { app, queryClient }
}
