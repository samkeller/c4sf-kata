import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Product } from '#shared/product.ts'
import { readStoredCart, writeStoredCart } from '../api/cart-storage.ts'
import { saveCart } from '../api/save-cart.ts'
import { useCartStore } from './cart-store.ts'

vi.mock('../api/save-cart.ts', () => ({ saveCart: vi.fn() }))
vi.mock('../api/cart-storage.ts', () => ({ readStoredCart: vi.fn(), writeStoredCart: vi.fn() }))
const toastAdd = vi.fn()
vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: toastAdd }) }))

const mascara: Product = {
  id: 1,
  title: 'Essence Mascara Lash Princess',
  price: 9.99,
  rating: 2.56,
  image: 'https://cdn.dummyjson.com/mascara.webp',
  category: 'beauty',
}
const lipstick: Product = { ...mascara, id: 4, title: 'Red Lipstick', price: 12.99 }

/** Réponse serveur pilotée par le test, pour choisir l'ordre et l'issue des confirmations. */
function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('cart store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(readStoredCart).mockReturnValue({ lines: [] })
  })

  it('shows a change immediately and saves it locally, before the server answers', () => {
    vi.mocked(saveCart).mockReturnValue(new Promise(() => {}))
    const cart = useCartStore()

    void cart.add(mascara)

    expect(cart.count).toBe(1)
    expect(cart.status).toBe('syncing')
    expect(writeStoredCart).toHaveBeenCalledWith({
      lines: [expect.objectContaining({ productId: 1 })],
    })
  })

  it('goes back to idle once the server confirms', async () => {
    vi.mocked(saveCart).mockResolvedValue()
    const cart = useCartStore()

    await cart.add(mascara)

    expect(cart.status).toBe('idle')
    expect(cart.count).toBe(1)
  })

  it('rolls back to the last confirmed cart when the server refuses, and says so', async () => {
    const cart = useCartStore()
    vi.mocked(saveCart).mockResolvedValueOnce()
    await cart.add(mascara)

    vi.mocked(saveCart).mockRejectedValueOnce(new Error('HTTP 503'))
    await cart.add(lipstick)

    expect(cart.lines.map((line) => line.productId)).toEqual([1])
    expect(cart.status).toBe('error')
    expect(writeStoredCart).toHaveBeenLastCalledWith({
      lines: [expect.objectContaining({ productId: 1 })],
    })
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }))
  })

  it('ignores the answer to a request that a newer change has replaced', async () => {
    const first = deferred()
    const second = deferred()
    vi.mocked(saveCart).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const cart = useCartStore()

    const adding = cart.add(mascara)
    const updating = cart.setQuantity(1, 3)
    // La première réponse, périmée, échoue : elle ne doit pas annuler le changement suivant.
    first.reject(new Error('HTTP 503'))
    await adding

    expect(cart.count).toBe(3)
    expect(cart.status).toBe('syncing')
    expect(toastAdd).not.toHaveBeenCalled()

    second.resolve()
    await updating
    expect(cart.status).toBe('idle')
  })

  it('sends the simulated failure flag to the server', async () => {
    vi.mocked(saveCart).mockResolvedValue()
    const cart = useCartStore()
    cart.simulateFailure = true

    await cart.add(mascara)

    expect(saveCart).toHaveBeenCalledWith(expect.anything(), { simulateFailure: true })
  })

  it('restores the stored cart and treats it as confirmed', async () => {
    vi.mocked(readStoredCart).mockReturnValue({
      lines: [
        { productId: 1, quantity: 2, title: 'Mascara', unitPrice: 9.99, image: mascara.image },
      ],
    })
    const cart = useCartStore()

    cart.restore()
    expect(cart.restored).toBe(true)
    expect(cart.count).toBe(2)

    vi.mocked(saveCart).mockRejectedValueOnce(new Error('HTTP 503'))
    await cart.remove(1)
    expect(cart.count).toBe(2)
  })
})
