import type { Cart } from '#shared/cart.ts'
import { HttpError } from '../../http-error.ts'

/** @param simulateFailure demande au serveur d'échouer (démo du rollback). */
export async function saveCart(cart: Cart, { simulateFailure }: { simulateFailure: boolean }) {
  const response = await fetch('/api/cart', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(simulateFailure ? { 'X-Simulate-Failure': 'true' } : {}),
    },
    body: JSON.stringify(cart),
  })
  if (!response.ok) throw new HttpError(response.status)
}
