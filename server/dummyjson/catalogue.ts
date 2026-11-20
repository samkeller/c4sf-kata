import { z } from 'zod'
import type { Product } from '#shared/product.ts'
import { UpstreamDataError, UpstreamUnavailableError } from '../errors.ts'
import { DUMMYJSON_API_URL, DUMMYJSON_TIMEOUT_MS } from './config.ts'

const dummyJsonProductSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  price: z.number().nonnegative(),
  rating: z.number().min(0).max(5),
  thumbnail: z.url(),
  category: z.string().min(1),
})

const dummyJsonCatalogueSchema = z.object({
  products: z.array(dummyJsonProductSchema),
})

// `limit=0` renvoie tout le catalogue en un appel. `select` est tiré du schéma pour ne demander
// que les champs validés, sans liste à maintenir en double (`id` est toujours renvoyé).
const catalogueUrl = new URL('/products', DUMMYJSON_API_URL)
catalogueUrl.searchParams.set('limit', '0')
catalogueUrl.searchParams.set('select', Object.keys(dummyJsonProductSchema.shape).join(','))

/** Nom d'affichage déduit du slug (`mens-shirts` → `Mens shirts`), sans second appel à l'API. */
export function dummyJsonCategoryName(slug: string): string {
  const words = slug.replaceAll('-', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function parseDummyJsonCatalogue(body: unknown): Product[] {
  const result = dummyJsonCatalogueSchema.safeParse(body)
  if (!result.success) {
    throw new UpstreamDataError(`Invalid DummyJSON catalogue:\n${z.prettifyError(result.error)}`, {
      cause: result.error,
    })
  }
  return result.data.products.map((product) => ({
    id: product.id,
    title: product.title,
    price: product.price,
    rating: product.rating,
    image: product.thumbnail,
    category: { slug: product.category, name: dummyJsonCategoryName(product.category) },
  }))
}

/**
 * Charge le catalogue complet depuis DummyJSON.
 *
 * @throws {UpstreamUnavailableError} réseau, timeout ou statut HTTP en erreur.
 * @throws {UpstreamDataError} corps non JSON ou non conforme au schéma.
 */
export async function fetchDummyJsonCatalogue(): Promise<Product[]> {
  let response: Response
  try {
    response = await fetch(catalogueUrl, { signal: AbortSignal.timeout(DUMMYJSON_TIMEOUT_MS) })
  } catch (error) {
    throw new UpstreamUnavailableError('DummyJSON is unreachable', { cause: error })
  }
  if (!response.ok) {
    throw new UpstreamUnavailableError(`DummyJSON responded with HTTP ${response.status}`)
  }

  let body: unknown
  try {
    body = await response.json()
  } catch (error) {
    throw new UpstreamDataError('DummyJSON returned a body that is not JSON', { cause: error })
  }
  return parseDummyJsonCatalogue(body)
}
