import type { LoadProductList, ProductListResponse } from '#shared/product-list.ts'
import { HttpError } from '../../http-error.ts'

/**
 * Charge une page de produits depuis notre API, côté navigateur.
 *
 * @throws {HttpError} si l'API répond en erreur.
 * @throws {TypeError} si le réseau échoue (comportement de `fetch`).
 */
export const fetchProductList: LoadProductList = async (query) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }

  const response = await fetch(`/api/products?${params}`)
  if (!response.ok) throw new HttpError(response.status)
  // Pas de validation Zod ici : l'API est la nôtre, livrée avec ce code et typée par le même
  // contrat partagé. Zod reste aux frontières qu'on ne contrôle pas (DummyJSON, localStorage).
  return (await response.json()) as ProductListResponse
}
