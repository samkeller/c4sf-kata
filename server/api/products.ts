import { Router } from 'express'
import { fetchDummyJsonCatalogue } from '../dummyjson/catalogue.ts'
import { UpstreamDataError, UpstreamUnavailableError } from '../errors.ts'

export const productsRouter = Router()

productsRouter.get('/', async (_req, res) => {
  try {
    const products = await fetchDummyJsonCatalogue()
    res.json({ products, total: products.length })
  } catch (error) {
    if (!(error instanceof UpstreamDataError || error instanceof UpstreamUnavailableError)) {
      throw error
    }
    // Le détail (champ fautif, statut amont) reste dans les logs : le client n'en a pas l'usage.
    console.error(error)
    res.status(502).json({ error: 'Catalogue unavailable' })
  }
})
