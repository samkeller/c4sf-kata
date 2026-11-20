import { z } from 'zod'
import type { Category, Product } from './product.ts'

export const PAGE_SIZE = 20

/** Partagé : valide les requêtes `/api/products` côté serveur et l'URL côté navigateur. */
export const productQuerySchema = z
  .object({
    // Une recherche vide équivaut à pas de recherche.
    q: z
      .string()
      .trim()
      .max(100)
      .transform((value) => value || undefined)
      .optional(),
    category: z.string().min(1).optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    page: z.coerce.number().int().min(1).default(1),
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    { message: 'minPrice must not exceed maxPrice', path: ['minPrice'] },
  )

export type ProductQuery = z.infer<typeof productQuerySchema>

/** Critères → paramètres d'URL, sans les critères absents ni la page 1 : des URL courtes. */
export function toProductSearchParams(query: ProductQuery): Record<string, string> {
  const params: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params[key] = String(value)
  }
  if (query.page === 1) delete params.page
  return params
}

export interface ProductPage {
  products: Product[]
  total: number
}

/**
 * Réponse de `GET /api/products`, aussi fournie directement au rendu serveur.
 * Les catégories couvrent tout le catalogue, pas seulement la page.
 */
export interface ProductListResponse extends ProductPage {
  categories: Category[]
}

/**
 * Source de la liste produits fournie à l'app : appel direct au catalogue pendant le rendu
 * serveur, `GET /api/products` dans le navigateur.
 *
 * @param signal annule la requête quand des critères plus récents la remplacent.
 */
export type LoadProductList = (
  query: ProductQuery,
  signal?: AbortSignal,
) => Promise<ProductListResponse>
