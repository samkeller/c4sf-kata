import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  productQuerySchema,
  toProductSearchParams,
  type ProductQuery,
} from '#shared/product-list.ts'

export type ProductFilters = Omit<ProductQuery, 'page'>

/**
 * Critères de la liste, lus et écrits dans l'URL, qui est l'unique source de vérité :
 * un lien se partage, précédent / suivant fonctionnent, et le serveur rend une URL filtrée.
 */
export function useProductQuery() {
  const route = useRoute()
  const router = useRouter()

  const query = computed<ProductQuery>(() => {
    const parsed = productQuerySchema.safeParse(route.query)
    // URL invalide (modifiée à la main) : la liste complète plutôt qu'une erreur.
    return parsed.success ? parsed.data : { page: 1 }
  })
  const hasFilters = computed(
    () => Object.keys(toProductSearchParams({ ...query.value, page: 1 })).length > 0,
  )

  function navigate(next: ProductQuery) {
    return router.push({ query: toProductSearchParams(next) })
  }

  return {
    query,
    hasFilters,
    /** La page revient à 1, puisque les résultats changent. */
    updateFilters: (changes: Partial<ProductFilters>) =>
      navigate({ ...query.value, ...changes, page: 1 }),
    goToPage: (page: number) => navigate({ ...query.value, page }),
    clearFilters: () => navigate({ page: 1 }),
  }
}
