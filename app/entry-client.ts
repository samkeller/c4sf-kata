import { hydrate, type DehydratedState } from '@tanstack/vue-query'
import { createApp } from './main.ts'
import { fetchProductList } from './products/api/fetch-product-list.ts'

const { app, queryClient } = createApp(fetchProductList)

// Le cache doit être restauré avant le montage : le premier rendu client reprend ainsi
// exactement les données du HTML serveur, sans refaire l'appel.
const serializedState = document.getElementById('app-state')?.textContent?.trim()
if (serializedState) {
  // Produit par entry-server dans la même réponse : on ne le revalide pas.
  hydrate(queryClient, JSON.parse(serializedState) as DehydratedState)
}

app.mount('#app')
