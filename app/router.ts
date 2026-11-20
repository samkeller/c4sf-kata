import { createRouter, type RouterHistory } from 'vue-router'
import ProductList from './products/ui/ProductList.vue'

export function createAppRouter(history: RouterHistory) {
  return createRouter({
    history,
    routes: [
      { path: '/', component: ProductList },
      { path: '/cart', component: () => import('./cart/ui/CartPage.vue') },
      { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) return savedPosition
      // Un filtre garde la position, pour ne pas faire sauter la page pendant la saisie.
      if (to.path !== from.path || to.query.page !== from.query.page) return { top: 0 }
      return false
    },
  })
}
