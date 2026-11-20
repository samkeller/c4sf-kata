import { describe, expect, it, vi } from 'vitest'
import { UpstreamDataError, UpstreamUnavailableError } from '../errors.ts'
import {
  dummyJsonCategoryName,
  fetchDummyJsonCatalogue,
  parseDummyJsonCatalogue,
} from './catalogue.ts'

const mascara = {
  id: 1,
  title: 'Essence Mascara Lash Princess',
  price: 9.99,
  rating: 2.56,
  thumbnail:
    'https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp',
  category: 'beauty',
}

describe('dummyJsonCategoryName', () => {
  it.each([
    ['beauty', 'Beauty'],
    ['mens-shirts', 'Mens shirts'],
    ['home-decoration', 'Home decoration'],
  ])('names the %s category %s', (slug, name) => {
    expect(dummyJsonCategoryName(slug)).toBe(name)
  })
})

describe('parseDummyJsonCatalogue', () => {
  it('maps DummyJSON products to our Product type', () => {
    expect(parseDummyJsonCatalogue({ products: [mascara] })).toEqual([
      {
        id: 1,
        title: 'Essence Mascara Lash Princess',
        price: 9.99,
        rating: 2.56,
        image: mascara.thumbnail,
        category: { slug: 'beauty', name: 'Beauty' },
      },
    ])
  })

  it('drops upstream fields that Product does not use', () => {
    const [product] = parseDummyJsonCatalogue({
      total: 1,
      products: [{ ...mascara, description: 'Popular mascara', stock: 99 }],
    })

    expect(product).not.toHaveProperty('description')
    expect(product).not.toHaveProperty('stock')
  })

  it('rejects a product with a missing field', () => {
    const withoutTitle: Partial<typeof mascara> = { ...mascara }
    delete withoutTitle.title

    expect(() => parseDummyJsonCatalogue({ products: [withoutTitle] })).toThrow(UpstreamDataError)
  })

  it.each([
    ['a price given as a string', { price: '9.99' }],
    ['a negative price', { price: -1 }],
    ['a rating above 5', { rating: 7 }],
    ['a thumbnail that is not a URL', { thumbnail: 'not a url' }],
  ])('rejects %s', (_case, override) => {
    expect(() => parseDummyJsonCatalogue({ products: [{ ...mascara, ...override }] })).toThrow(
      UpstreamDataError,
    )
  })

  it('rejects the whole catalogue when a single product is invalid', () => {
    const body = { products: [mascara, { ...mascara, id: 2, price: null }] }

    // Le message indique le chemin fautif, pour diagnostiquer sans rejouer la requête.
    expect(() => parseDummyJsonCatalogue(body)).toThrow('products[1].price')
  })

  it('rejects a response without a product list', () => {
    expect(() => parseDummyJsonCatalogue({ message: 'Too many requests' })).toThrow(
      UpstreamDataError,
    )
  })
})

describe('fetchDummyJsonCatalogue', () => {
  it('returns the mapped catalogue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ products: [mascara] })))

    const products = await fetchDummyJsonCatalogue()

    expect(products).toHaveLength(1)
    expect(products[0]?.image).toBe(mascara.thumbnail)
  })

  it('requests the whole catalogue, trimmed to the validated fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ products: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await fetchDummyJsonCatalogue()

    const url = new URL(fetchMock.mock.calls[0]?.[0] as URL)
    expect(url.searchParams.get('limit')).toBe('0')
    expect(url.searchParams.get('select')).toBe('id,title,price,rating,thumbnail,category')
  })

  it('reports an unreachable upstream', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))

    await expect(fetchDummyJsonCatalogue()).rejects.toThrow(UpstreamUnavailableError)
  })

  it('reports an upstream HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('busy', { status: 503 })))

    await expect(fetchDummyJsonCatalogue()).rejects.toThrow('HTTP 503')
  })

  it('reports a body that is not JSON as invalid data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>oops</html>')))

    await expect(fetchDummyJsonCatalogue()).rejects.toThrow(UpstreamDataError)
  })
})
