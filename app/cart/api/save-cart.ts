import type { Cart } from '#shared/cart.ts'
import { HttpError } from '../../http-error.ts'

/**
 * Envoie le panier complet à `PUT /api/cart` pour confirmation.
 *
 * @param simulateFailure demande au serveur d'échouer (démo du rollback).
 * @throws {HttpError} si le serveur refuse ou ne peut pas confirmer.
 * @throws {TypeError} si le réseau échoue (comportement de `fetch`).
 */
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
