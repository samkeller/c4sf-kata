import { Router } from 'express'
import { z } from 'zod'
import { productQuerySchema } from '#shared/product-list.ts'
import { getProductList } from '../catalogue/catalogue.ts'
import { UpstreamDataError, UpstreamUnavailableError } from '../errors.ts'

export const productsRouter = Router()

productsRouter.get('/', async (req, res) => {
  const query = productQuerySchema.safeParse(req.query)
  if (!query.success) {
    res.status(400).json({ error: z.prettifyError(query.error) })
    return
  }

  try {
    res.json(await getProductList(query.data))
  } catch (error) {
    if (!(error instanceof UpstreamDataError || error instanceof UpstreamUnavailableError)) {
      throw error
    }
    // Le détail (champ fautif, statut amont) reste dans les logs : le client n'en a pas l'usage.
    console.error(error)
    res.status(502).json({ error: 'Catalogue unavailable' })
  }
})
