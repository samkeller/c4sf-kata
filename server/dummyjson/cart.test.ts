import { describe, expect, it, vi } from 'vitest'
import type { Cart } from '#shared/cart.ts'
import { aCartLine } from '#shared/test-fixtures.ts'
import { UpstreamUnavailableError } from '../errors.ts'
import { confirmDummyJsonCart } from './cart.ts'

const cart: Cart = { lines: [aCartLine()] }

describe('confirmDummyJsonCart', () => {
  it('replaces the DummyJSON cart with our product ids and quantities', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 1 }))
    vi.stubGlobal('fetch', fetchMock)

    await confirmDummyJsonCart(cart)

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.pathname).toBe('/carts/1')
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body as string)).toEqual({
      merge: false,
      products: [{ id: 1, quantity: 2 }],
    })
  })

  it('reports an unreachable upstream', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))

    await expect(confirmDummyJsonCart(cart)).rejects.toThrow(UpstreamUnavailableError)
  })

  it('reports an upstream HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('busy', { status: 503 })))

    await expect(confirmDummyJsonCart(cart)).rejects.toThrow('HTTP 503')
  })
})
