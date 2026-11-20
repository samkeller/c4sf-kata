import { computed, inject, onServerPrefetch, type InjectionKey } from 'vue'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import type { LoadProductList } from '#shared/product-list.ts'
import { useProductQuery } from './use-product-query.ts'

/** Fournie par `createApp()` : catalogue direct côté serveur, HTTP côté navigateur. */
export const loadProductListKey: InjectionKey<LoadProductList> = Symbol('loadProductList')

/**
 * Liste produits correspondant aux critères de l'URL.
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

  const { query } = useProductQuery()

  const { data, status, isFetching, isPlaceholderData, refetch, suspense } = useQuery({
    queryKey: computed(() => ['products', query.value] as const),
    // Avec le signal, Vue Query annule une requête remplacée par des critères plus récents.
    queryFn: ({ queryKey: [, criteria], signal }) => loadProductList(criteria, signal),
    // Les résultats restent affichés pendant le chargement des suivants (pas de squelettes).
    placeholderData: keepPreviousData,
  })
  onServerPrefetch(suspense) // Attends la requête sur le serveur avant de générer le HTML

  return {
    status,
    products: computed(() => data.value?.products ?? []),
    total: computed(() => data.value?.total ?? 0),
    categories: computed(() => data.value?.categories ?? []),
    isUpdating: computed(() => isFetching.value && isPlaceholderData.value),
    retry: () => void refetch(),
  }
}
