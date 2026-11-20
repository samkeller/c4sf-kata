import type { Cart } from '#shared/cart.ts'
import { UpstreamUnavailableError } from '../errors.ts'
import { DUMMYJSON_API_URL, DUMMYJSON_TIMEOUT_MS } from './config.ts'

// DummyJSON simule les écritures sur un panier existant : rien n'est enregistré.
const cartUrl = new URL('/carts/1', DUMMYJSON_API_URL)

/**
 * Fait confirmer le panier par DummyJSON. Seule la réussite compte : sa réponse n'est pas lue,
 * le panier du navigateur reste la référence.
 */
export async function confirmDummyJsonCart(cart: Cart): Promise<void> {
  const body = {
    // Remplace le contenu du panier au lieu de fusionner avec l'existant.
    merge: false,
    products: cart.lines.map((line) => ({ id: line.productId, quantity: line.quantity })),
  }

  let response: Response
  try {
    response = await fetch(cartUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(DUMMYJSON_TIMEOUT_MS),
    })
  } catch (error) {
    throw new UpstreamUnavailableError('DummyJSON is unreachable', { cause: error })
  }
  if (!response.ok) {
    throw new UpstreamUnavailableError(`DummyJSON responded with HTTP ${response.status}`)
  }
}
