import type { ProductListResponse, ProductQuery } from '#shared/product-list.ts'
import { fetchDummyJsonCatalogue } from '../dummyjson/catalogue.ts'
import { createCatalogueCache } from './catalogue-cache.ts'
import { listCategories, queryProducts } from './query-products.ts'

/**
 * Temps de vie du cache du catalogue (TTL).
 */
const CATALOGUE_TTL_MS = 5 * 60 * 1000 // 5 minutes in milliseconds

/**
 * Catalogue complet, chargé depuis DummyJSON au plus une fois par TTL.
 *
 * Seul endroit qui choisit la source de données. Le cache est partagé par tout le processus :
 * c'est sans risque car le catalogue est public, il ne contient rien de propre à un visiteur.
 *
 * @throws {UpstreamUnavailableError | UpstreamDataError} si le chargement échoue.
 */
export const getCatalogue = createCatalogueCache(fetchDummyJsonCatalogue, CATALOGUE_TTL_MS)

/**
 * Page de produits correspondant aux critères, avec les catégories du catalogue.
 * Utilisée par `GET /api/products` et par le rendu serveur, qui l'appelle sans passer par HTTP.
 *
 * @throws {UpstreamUnavailableError | UpstreamDataError} si le chargement du catalogue échoue.
 */
export async function getProductList(query: ProductQuery): Promise<ProductListResponse> {
  const catalogue = await getCatalogue()
  return { ...queryProducts(catalogue, query), categories: listCategories(catalogue) }
}
