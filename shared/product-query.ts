import { z } from 'zod'
import type { Product } from './product.ts'

export const PAGE_SIZE = 20

/**
 * Critères de la liste produits, lus depuis les query params.
 * Partagé : le serveur valide les requêtes `/api/products` et le client lira les mêmes
 * paramètres dans l'URL, qui reste la source de vérité de la recherche et des filtres.
 */
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

/** Une page de résultats, avec le total des produits qui correspondent aux critères. */
export interface ProductPage {
  products: Product[]
  total: number
}
