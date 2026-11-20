import { fetchDummyJsonCatalogue } from '../dummyjson/catalogue.ts'
import { createCatalogueCache } from './catalogue-cache.ts'

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
