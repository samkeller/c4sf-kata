import { QueryClient } from '@tanstack/vue-query'
import { isTemporaryError } from './http-error.ts'

const MAX_RETRIES = 2

/** Politique de retry côté navigateur : 2 nouvelles tentatives, sur les erreurs temporaires uniquement. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  return failureCount < MAX_RETRIES && isTemporaryError(error)
}

/**
 * Un client par app, donc un par requête côté serveur : le cache ne doit jamais
 * être partagé entre visiteurs.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Le catalogue bouge peu : pas de refetch pendant 5 min, cache gardé 30 min.
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        // Côté serveur, réessayer retarderait la réponse HTML : on rend l'erreur, et le
        // navigateur relancera la requête après l'hydratation.
        retry: import.meta.env.SSR ? false : shouldRetry,
      },
    },
  })
}
