import { createRouter, type RouterHistory } from 'vue-router'
import ProductList from './products/ui/ProductList.vue'

/** @param history mémoire côté serveur, historique du navigateur côté client. */
export function createAppRouter(history: RouterHistory) {
  return createRouter({
    history,
    routes: [
      { path: '/', component: ProductList },
      // Chargée à la demande : son code n'est téléchargé qu'à la première visite du panier.
      { path: '/cart', component: () => import('./cart/ui/CartPage.vue') },
      { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
  })
}
