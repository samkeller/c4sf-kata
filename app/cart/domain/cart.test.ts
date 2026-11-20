import { describe, expect, it } from 'vitest'
import type { Cart } from '#shared/cart.ts'
import { aProduct } from '#shared/test-fixtures.ts'
import {
  addProduct,
  cartTotal,
  decrementProduct,
  incrementProduct,
  itemCount,
  lineTotal,
  quantityOf,
  removeLine,
  setQuantity,
} from './cart.ts'

const mascara = aProduct()
const lipstick = aProduct({ id: 4, title: 'Red Lipstick', price: 12.99 })

const empty: Cart = { lines: [] }

describe('addProduct', () => {
  it('adds a new line with a snapshot of the product', () => {
    expect(addProduct(empty, mascara)).toEqual({
      lines: [
        {
          productId: 1,
          quantity: 1,
          title: 'Essence Mascara Lash Princess',
          unitPrice: 9.99,
          image: mascara.image,
        },
      ],
    })
  })

  it('increments the existing line instead of adding a second one', () => {
    const cart = addProduct(addProduct(empty, mascara), mascara)

    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0]?.quantity).toBe(2)
  })

  it('leaves the previous cart untouched', () => {
    const before = addProduct(empty, mascara)
    addProduct(before, mascara)

    expect(before.lines[0]?.quantity).toBe(1)
  })
})

describe('setQuantity', () => {
  const cart = addProduct(addProduct(empty, mascara), lipstick)

  it('changes the quantity of one line only', () => {
    const updated = setQuantity(cart, 4, 3)

    expect(updated.lines.map((line) => line.quantity)).toEqual([1, 3])
  })

  it.each([
    [0, 1],
    [-2, 1],
    [2.7, 2],
  ])('brings %s back to %s', (quantity, expected) => {
    expect(setQuantity(cart, 1, quantity).lines[0]?.quantity).toBe(expected)
  })
})

describe('incrementProduct and decrementProduct', () => {
  const cart = setQuantity(addProduct(empty, mascara), 1, 2)

  it('adds or takes one unit', () => {
    expect(quantityOf(incrementProduct(cart, 1), 1)).toBe(3)
    expect(quantityOf(decrementProduct(cart, 1), 1)).toBe(1)
  })

  it('removes the line when its last unit is taken', () => {
    expect(decrementProduct(addProduct(empty, mascara), 1).lines).toEqual([])
  })
})

describe('removeLine', () => {
  it('removes the line of the product', () => {
    const cart = removeLine(addProduct(addProduct(empty, mascara), lipstick), 1)

    expect(cart.lines.map((line) => line.productId)).toEqual([4])
  })
})

describe('totals', () => {
  const cart = setQuantity(addProduct(addProduct(empty, mascara), lipstick), 1, 3)

  it('multiplies the unit price by the quantity for a line', () => {
    expect(lineTotal(cart.lines[0]!)).toBeCloseTo(29.97)
  })

  it('sums the lines for the cart', () => {
    expect(cartTotal(cart)).toBeCloseTo(42.96)
  })

  it('counts the items, quantities included', () => {
    expect(itemCount(cart)).toBe(4)
    expect(itemCount(empty)).toBe(0)
  })
})
