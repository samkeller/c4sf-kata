import type { Product } from '#shared/product.ts'

/**
 * Garde en mémoire le catalogue renvoyé par `load` pendant `ttlMs`.
 *
 * Les appels qui arrivent pendant un chargement attendent ce même chargement : un afflux de
 * requêtes à l'expiration ne déclenche qu'un appel amont. Un échec n'est pas mis en cache,
 * l'appel suivant réessaie.
 */
export function createCatalogueCache(
  load: () => Promise<Product[]>,
  ttlMs: number,
): () => Promise<Product[]> {
  let cached: { products: Product[]; expiresAt: number } | undefined
  let pending: Promise<Product[]> | undefined

  return () => {
    if (cached && Date.now() < cached.expiresAt) return Promise.resolve(cached.products)

    pending ??= load()
      .then((products) => {
        cached = { products, expiresAt: Date.now() + ttlMs }
        return products
      })
      .finally(() => {
        pending = undefined
      })
    return pending
  }
}
