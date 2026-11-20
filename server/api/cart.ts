import express, { Router } from 'express'
import { z } from 'zod'
import { cartSchema } from '#shared/cart.ts'
import { confirmDummyJsonCart } from '../dummyjson/cart.ts'
import { UpstreamUnavailableError } from '../errors.ts'

export const cartRouter = Router()

/**
 * `PUT /api/cart` : fait confirmer le panier complet. Rien n'est enregistré côté serveur,
 * le navigateur reste la source de vérité.
 *
 * 204 si confirmé, 400 si le panier est invalide, 502 si la confirmation échoue,
 * 503 si l'en-tête `X-Simulate-Failure: true` est présent (démo du rollback).
 */
cartRouter.put('/', express.json({ limit: '50kb' }), async (req, res) => {
  const cart = cartSchema.safeParse(req.body)
  if (!cart.success) {
    res.status(400).json({ error: z.prettifyError(cart.error) })
    return
  }

  // Démo rollback, sans dépendre d'une vraie panne de DummyJSON.
  if (req.get('X-Simulate-Failure') === 'true') {
    res.status(503).json({ error: 'Simulated failure' })
    return
  }

  try {
    await confirmDummyJsonCart(cart.data)
    res.status(204).end()
  } catch (error) {
    if (!(error instanceof UpstreamUnavailableError)) throw error
    console.error(error)
    res.status(502).json({ error: 'Cart confirmation unavailable' })
  }
})
