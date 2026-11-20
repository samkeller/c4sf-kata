import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Product } from '#shared/product.ts'
import { aProduct } from '#shared/test-fixtures.ts'
import { createCatalogueCache } from './catalogue-cache.ts'

const TTL_MS = 5 * 60 * 1000

const catalogue: Product[] = [aProduct()]

describe('createCatalogueCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads the catalogue at most once per TTL', async () => {
    const load = vi.fn().mockResolvedValue(catalogue)
    const getCatalogue = createCatalogueCache(load, TTL_MS)

    await getCatalogue()
    vi.advanceTimersByTime(TTL_MS - 1)
    await getCatalogue()

    expect(load).toHaveBeenCalledTimes(1)
  })

  it('loads the catalogue again once the TTL has passed', async () => {
    const load = vi.fn().mockResolvedValue(catalogue)
    const getCatalogue = createCatalogueCache(load, TTL_MS)

    await getCatalogue()
    vi.advanceTimersByTime(TTL_MS)
    await getCatalogue()

    expect(load).toHaveBeenCalledTimes(2)
  })

  it('shares one load between concurrent calls', async () => {
    const load = vi.fn().mockResolvedValue(catalogue)
    const getCatalogue = createCatalogueCache(load, TTL_MS)

    const results = await Promise.all([getCatalogue(), getCatalogue(), getCatalogue()])

    expect(load).toHaveBeenCalledTimes(1)
    expect(results).toEqual([catalogue, catalogue, catalogue])
  })

  it('does not cache a failure: the next call retries', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('upstream down'))
      .mockResolvedValue(catalogue)
    const getCatalogue = createCatalogueCache(load, TTL_MS)

    await expect(getCatalogue()).rejects.toThrow('upstream down')
    await expect(getCatalogue()).resolves.toEqual(catalogue)
    expect(load).toHaveBeenCalledTimes(2)
  })
})
