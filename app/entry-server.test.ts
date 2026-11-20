import { describe, expect, it } from 'vitest'
import type { Product } from '#shared/product.ts'
import type { LoadProductList } from '#shared/product-list.ts'
import { render } from './entry-server.ts'

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    title: 'Essence Mascara Lash Princess',
    price: 9.99,
    rating: 2.56,
    image: 'https://cdn.dummyjson.com/mascara.webp',
    category: 'beauty',
    ...overrides,
  }
}

function source(products: Product[]): LoadProductList {
  return async () => ({ products, total: products.length, categories: ['beauty'] })
}

const failingSource: LoadProductList = async () => {
  throw new Error('Catalogue unavailable')
}

describe('render', () => {
  it('renders the products in the server HTML', async () => {
    const { html } = await render('/', { loadProductList: source([product()]) })

    expect(html).toContain('Essence Mascara Lash Princess')
    expect(html).toContain('$9.99')
  })

  it('loads the first images eagerly with high priority and lazy-loads the rest', async () => {
    const products = Array.from({ length: 6 }, (_, index) => product({ id: index + 1 }))
    const { html } = await render('/', { loadProductList: source(products) })

    expect(html.match(/fetchpriority="high"/g)).toHaveLength(4)
    expect(html.match(/loading="lazy"/g)).toHaveLength(2)
  })

  it('passes the fetched products to the client in the dehydrated state', async () => {
    const { state } = await render('/', { loadProductList: source([product()]) })

    const dehydrated = JSON.parse(state)
    expect(dehydrated.queries[0].state.data.products[0].title).toBe('Essence Mascara Lash Princess')
  })

  it('escapes markup in the state so it cannot close its script tag', async () => {
    const { state } = await render('/', {
      loadProductList: source([product({ title: '</script><script>alert(1)</script>' })]),
    })

    expect(state).not.toContain('<')
    expect(JSON.parse(state).queries[0].state.data.products[0].title).toBe(
      '</script><script>alert(1)</script>',
    )
  })

  it('renders the error state when loading fails, and passes it to the client', async () => {
    const { html, state } = await render('/', { loadProductList: failingSource })

    expect(html).toContain('Products could not be loaded.')
    // Sans l'erreur dans l'état, le client démarrerait en chargement : mismatch d'hydratation.
    expect(JSON.parse(state).queries[0].state.status).toBe('error')
  })

  it('renders the empty state when no product matches', async () => {
    const { html } = await render('/', { loadProductList: source([]) })

    expect(html).toContain('No products found.')
  })

  it('renders the lazy cart page without any cart content, which only the browser knows', async () => {
    const { html } = await render('/cart', { loadProductList: source([product()]) })

    expect(html).toContain('Your cart')
    expect(html).not.toContain('Your cart is empty.')
    expect(html).not.toContain('p-badge')
  })

  it('inlines the theme and the styles of the PrimeVue components it rendered', async () => {
    const { head } = await render('/', { loadProductList: source([product()]) })

    // L'ordre des couches doit être la première déclaration `@layer` de la page.
    expect(head).toMatch(
      /^<style[^>]*data-primevue-style-id="layer-order">@layer theme, base, primevue/,
    )
    expect(head).toContain('data-primevue-style-id="semantic-variables"')
    expect(head).toContain('data-primevue-style-id="card-style"')
    expect(head).toContain('data-primevue-style-id="rating-style"')
  })

  it('gives the same output for every request', async () => {
    // Un état partagé entre requêtes (compteur d'ids, styles déjà marqués comme chargés)
    // ferait diverger le deuxième rendu et casserait l'hydratation.
    const context = { loadProductList: source([product()]) }
    const first = await render('/', context)
    const second = await render('/', context)

    expect(second.html).toEqual(first.html)
    expect(second.head).toEqual(first.head)
  })
})
