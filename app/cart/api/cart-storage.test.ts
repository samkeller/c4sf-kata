import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Cart } from '#shared/cart.ts'
import { aCartLine } from '#shared/test-fixtures.ts'
import { CART_STORAGE_KEY, readStoredCart, writeStoredCart } from './cart-storage.ts'

const cart: Cart = { lines: [aCartLine()] }

function memoryStorage(): Storage {
  const items = new Map<string, string>()
  return {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, value),
  }
}

describe('cart storage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
  })

  it('reads back the cart it wrote', () => {
    writeStoredCart(cart)

    expect(readStoredCart()).toEqual(cart)
  })

  it('gives an empty cart when nothing is stored', () => {
    expect(readStoredCart()).toEqual({ lines: [] })
  })

  it.each([
    ['invalid JSON', '{not json'],
    ['another format', JSON.stringify([{ id: 1, qty: 2 }])],
    ['an invalid quantity', JSON.stringify({ lines: [aCartLine({ quantity: -1 })] })],
  ])('gives an empty cart for %s', (_case, raw) => {
    localStorage.setItem(CART_STORAGE_KEY, raw)

    expect(readStoredCart()).toEqual({ lines: [] })
  })
})
