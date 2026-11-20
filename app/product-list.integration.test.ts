import { expect, it, vi } from 'vitest'
import { getProductList } from '../server/catalogue/catalogue.ts'
import { render } from './entry-server.ts'

// Toute la chaîne, sans réseau : réponse DummyJSON → validation et mapping → filtre → rendu.
it('renders the products of a DummyJSON response, mapped and filtered by the URL', async () => {
  const thumbnail = (slug: string) => `https://cdn.dummyjson.com/${slug}/thumbnail.webp`
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({
        products: [
          {
            id: 1,
            title: 'Essence Mascara',
            price: 9.99,
            rating: 2.56,
            thumbnail: thumbnail('mascara'),
            category: 'beauty',
          },
          {
            id: 4,
            title: 'Red Lipstick',
            price: 12.99,
            rating: 4.36,
            thumbnail: thumbnail('red-lipstick'),
            category: 'beauty',
          },
          {
            id: 6,
            title: 'Red Perfume',
            price: 49.99,
            rating: 4.37,
            thumbnail: thumbnail('red-perfume'),
            category: 'mens-fragrances',
          },
        ],
      }),
    ),
  )

  const { html } = await render('/?q=red&category=beauty', { loadProductList: getProductList })

  expect(html).toContain(`src="${thumbnail('red-lipstick')}"`)
  expect(html).toMatch(/<mark[^>]*>Red<\/mark>/)
  expect(html).toContain('$12.99')
  expect(html).toContain('1 product')
  expect(html).not.toContain('Essence Mascara')
  expect(html).not.toContain('Red Perfume')
  // Le slug DummyJSON devient un nom lisible (Tag de la carte, filtre actif).
  expect(html).toContain('>Beauty<')
})
