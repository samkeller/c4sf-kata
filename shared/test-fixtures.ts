import type { CartLine } from './cart.ts'
import type { Product } from './product.ts'

/** Un produit valide ; les champs passés remplacent les valeurs par défaut. */
export function aProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    title: 'Essence Mascara Lash Princess',
    price: 9.99,
    rating: 2.56,
    image: 'https://cdn.dummyjson.com/mascara.webp',
    category: { slug: 'beauty', name: 'Beauty' },
    ...overrides,
  }
}

/** Une ligne de panier valide (le produit par défaut, en 2 exemplaires). */
export function aCartLine(overrides: Partial<CartLine> = {}): CartLine {
  return {
    productId: 1,
    quantity: 2,
    title: 'Essence Mascara Lash Princess',
    unitPrice: 9.99,
    image: 'https://cdn.dummyjson.com/mascara.webp',
    ...overrides,
  }
}
