import { describe, expect, it } from 'vitest'
import { cartSchema, type CartLine } from './cart.ts'
import { aCartLine } from './test-fixtures.ts'

const line = aCartLine()

describe('cartSchema', () => {
  it('accepts a valid cart, empty or not', () => {
    expect(cartSchema.safeParse({ lines: [line] }).success).toBe(true)
    expect(cartSchema.safeParse({ lines: [] }).success).toBe(true)
  })

  it('rejects two lines for the same product', () => {
    expect(cartSchema.safeParse({ lines: [line, { ...line, quantity: 1 }] }).success).toBe(false)
  })

  it.each([0, -1, 1.5])('rejects a quantity of %s', (quantity) => {
    expect(cartSchema.safeParse({ lines: [{ ...line, quantity }] }).success).toBe(false)
  })

  it('rejects a line without its snapshot', () => {
    const withoutTitle: Partial<CartLine> = { ...line }
    delete withoutTitle.title

    expect(cartSchema.safeParse({ lines: [withoutTitle] }).success).toBe(false)
  })

  it('rejects data that is not a cart', () => {
    expect(cartSchema.safeParse([line]).success).toBe(false)
    expect(cartSchema.safeParse(null).success).toBe(false)
  })
})
