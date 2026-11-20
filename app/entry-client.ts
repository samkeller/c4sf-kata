import { createWebHistory } from 'vue-router'
import { hydrate, type DehydratedState } from '@tanstack/vue-query'
import { useCartStore } from './cart/state/cart-store.ts'
import { createApp } from './main.ts'
import { fetchProductList } from './products/api/fetch-product-list.ts'

const { app, queryClient, pinia, router } = createApp({
  loadProductList: fetchProductList,
  history: createWebHistory(),
})

// Le cache doit être restauré avant le montage : le premier rendu client reprend ainsi
// exactement les données du HTML serveur, sans refaire l'appel.
const serializedState = document.getElementById('app-state')?.textContent?.trim()
if (serializedState) {
  // Produit par entry-server dans la même réponse : on ne le revalide pas.
  hydrate(queryClient, JSON.parse(serializedState) as DehydratedState)
}

// Une route chargée à la demande (/cart) doit avoir son code avant l'hydratation.
await router.isReady()
app.mount('#app')

// Le panier vit dans localStorage, que le serveur ne voit pas : il est restauré après
// l'hydratation, sinon le premier rendu client différerait du HTML serveur.
useCartStore(pinia).restore()
