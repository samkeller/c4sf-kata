import {
  toProductSearchParams,
  type LoadProductList,
  type ProductListResponse,
} from '#shared/product-list.ts'
import { HttpError } from '../../http-error.ts'

export const fetchProductList: LoadProductList = async (query, signal) => {
  const params = new URLSearchParams(toProductSearchParams(query))
  const response = await fetch(`/api/products?${params}`, { signal })
  if (!response.ok) throw new HttpError(response.status)
  // Pas de Zod : l'API est la nôtre et partage ce type. Zod reste aux frontières externes.
  return (await response.json()) as ProductListResponse
}
