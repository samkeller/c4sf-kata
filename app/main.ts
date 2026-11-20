import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import type { RouterHistory } from 'vue-router'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Aura from '@primeuix/themes/aura'
import { VueQueryPlugin } from '@tanstack/vue-query'
import type { LoadProductList } from '#shared/product-list.ts'
import App from './App.vue'
import 'primeicons/primeicons.css'
import './style.css'
import { loadProductListKey } from './products/state/use-product-list.ts'
import { createQueryClient } from './query-client.ts'
import { createAppRouter } from './router.ts'

interface CreateAppOptions {
  loadProductList: LoadProductList
  history: RouterHistory
}

/**
 * Une instance par requête : côté serveur, un état partagé (cache, stores, routeur)
 * fuiterait d'un utilisateur à l'autre.
 */
export function createApp({ loadProductList, history }: CreateAppOptions) {
  const app = createSSRApp(App)
  const queryClient = createQueryClient()
  const pinia = createPinia()
  const router = createAppRouter(history)

  app.use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        // Thème clair uniquement : sans ça, Aura suit le mode sombre du système
        // alors que le reste de la page reste clair.
        darkModeSelector: 'none',
        // Couche placée avant les utilitaires Tailwind, pour qu'une classe posée sur un
        // composant PrimeVue l'emporte sur son style par défaut.
        cssLayer: { name: 'primevue', order: 'theme, base, primevue' },
      },
    },
  })
  app.use(ToastService)
  app.use(VueQueryPlugin, { queryClient })
  app.use(pinia)
  app.use(router)
  app.provide(loadProductListKey, loadProductList)

  return { app, queryClient, pinia, router }
}
