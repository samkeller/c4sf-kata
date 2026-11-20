import { computed, inject, onServerPrefetch, type InjectionKey } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import type { LoadProductList, ProductQuery } from '#shared/product-list.ts'

/** Source de la liste produits, fournie par `createApp()` selon le côté (serveur ou navigateur). */
export const loadProductListKey: InjectionKey<LoadProductList> = Symbol('loadProductList')

/**
 * Liste produits de la page courante.
 *
 * Pendant le rendu serveur, la requête est attendue avant de générer le HTML (`onServerPrefetch`) :
 * les produits sont dans la première réponse, et le cache déshydraté évite un second appel
 * dans le navigateur.
 *
 * @link "use" =  Vue composable https://vuejs.org/guide/reusability/composables.html
 */
export function useProductList() {
  const loadProductList = inject(loadProductListKey)
  if (!loadProductList) throw new Error('useProductList() needs createApp() to provide a source')

  // Première page sans filtre ; la slice 5 lira ces critères dans l'URL.
  const query: ProductQuery = { page: 1 }

  const { data, status, refetch, suspense } = useQuery({
    queryKey: ['products', query] as const,
    queryFn: () => loadProductList(query),
  })
  onServerPrefetch(suspense) // Attends la requête sur le serveur avant de générer le HTML

  return {
    status,
    products: computed(() => data.value?.products ?? []),
    retry: () => void refetch(),
  }
}
