import { describe, expect, it } from 'vitest'
import { productQuerySchema, toProductSearchParams } from './product-list.ts'

describe('productQuerySchema', () => {
  it('defaults to the first page without criteria', () => {
    expect(productQuerySchema.parse({})).toEqual({ page: 1 })
  })

  it('converts query-string values to numbers', () => {
    const query = productQuerySchema.parse({ minPrice: '10', maxPrice: '99.5', page: '3' })

    expect(query).toEqual({ minPrice: 10, maxPrice: 99.5, page: 3 })
  })

  it('treats a blank search as no search', () => {
    expect(productQuerySchema.parse({ q: '   ' }).q).toBeUndefined()
  })

  it.each([
    ['a page below 1', { page: '0' }],
    ['a page that is not an integer', { page: '1.5' }],
    ['a negative price', { minPrice: '-5' }],
    ['a price that is not a number', { maxPrice: 'cheap' }],
    ['a minimum above the maximum', { minPrice: '50', maxPrice: '10' }],
    ['a repeated parameter', { q: ['a', 'b'] }],
  ])('rejects %s', (_case, input) => {
    expect(productQuerySchema.safeParse(input).success).toBe(false)
  })
})

describe('toProductSearchParams', () => {
  it('writes only the criteria that are set, as strings', () => {
    expect(toProductSearchParams({ q: 'red', minPrice: 5, page: 2 })).toEqual({
      q: 'red',
      minPrice: '5',
      page: '2',
    })
  })

  it('leaves out the first page, so the default URL stays bare', () => {
    expect(toProductSearchParams({ page: 1 })).toEqual({})
  })
})
