import { describe, expect, it } from 'vitest'
import type { Product } from '../../shared/product.ts'
import { PAGE_SIZE, type ProductQuery } from '../../shared/product-list.ts'
import { listCategories, queryProducts } from './query-products.ts'

function product(id: number, overrides: Partial<Product> = {}): Product {
  return {
    id,
    title: `Product ${id}`,
    price: id,
    rating: 4,
    image: `https://cdn.dummyjson.com/${id}.webp`,
    category: 'misc',
    ...overrides,
  }
}

function query(criteria: Partial<ProductQuery> = {}): ProductQuery {
  return { page: 1, ...criteria }
}

// 45 produits à prix 1 à 45 : trois pages, la dernière incomplète.
const catalogue = Array.from({ length: 45 }, (_, index) => product(index + 1))

const ids = (products: Product[]) => products.map((p) => p.id)

describe('queryProducts', () => {
  it('returns the first page and the full total without criteria', () => {
    const page = queryProducts(catalogue, query())

    expect(page.products).toHaveLength(PAGE_SIZE)
    expect(page.products[0]?.id).toBe(1)
    expect(page.total).toBe(45)
  })

  it('returns the rest of the products on the last page', () => {
    const page = queryProducts(catalogue, query({ page: 3 }))

    expect(ids(page.products)).toEqual([41, 42, 43, 44, 45])
    expect(page.total).toBe(45)
  })

  it('returns an empty page past the end, with the real total', () => {
    expect(queryProducts(catalogue, query({ page: 4 }))).toEqual({ products: [], total: 45 })
  })

  it('searches titles regardless of case', () => {
    const products = [product(1, { title: 'Red Lipstick' }), product(2, { title: 'Blue Pen' })]

    expect(ids(queryProducts(products, query({ q: 'lIPs' })).products)).toEqual([1])
  })

  it('keeps only the requested category', () => {
    const products = [product(1, { category: 'beauty' }), product(2, { category: 'groceries' })]

    expect(ids(queryProducts(products, query({ category: 'groceries' })).products)).toEqual([2])
  })

  it('includes both price bounds', () => {
    const page = queryProducts(catalogue, query({ minPrice: 10, maxPrice: 12 }))

    expect(ids(page.products)).toEqual([10, 11, 12])
  })

  it('combines every criterion before paginating', () => {
    // 30 téléphones dont 25 entre 100 et 200 € : la page 2 en contient 5.
    const phones = Array.from({ length: 30 }, (_, index) =>
      product(100 + index, {
        title: `Smartphone ${index}`,
        category: 'smartphones',
        price: index < 25 ? 100 + index : 500,
      }),
    )
    const lookalike = product(999, {
      title: 'Smartphone case',
      category: 'accessories',
      price: 150,
    })

    const page = queryProducts([...catalogue, lookalike, ...phones], {
      q: 'smartphone',
      category: 'smartphones',
      minPrice: 100,
      maxPrice: 200,
      page: 2,
    })

    expect(page.total).toBe(25)
    expect(ids(page.products)).toEqual([120, 121, 122, 123, 124])
  })
})

describe('listCategories', () => {
  it('lists each category once, sorted', () => {
    const products = [
      product(1, { category: 'groceries' }),
      product(2, { category: 'beauty' }),
      product(3, { category: 'groceries' }),
    ]

    expect(listCategories(products)).toEqual(['beauty', 'groceries'])
  })
})
