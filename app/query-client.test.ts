import { describe, expect, it } from 'vitest'
import { HttpError } from './http-error.ts'
import { shouldRetry } from './query-client.ts'

describe('shouldRetry', () => {
  it('retries a network failure twice, then gives up', () => {
    const networkError = new TypeError('Failed to fetch')

    expect(shouldRetry(0, networkError)).toBe(true)
    expect(shouldRetry(1, networkError)).toBe(true)
    expect(shouldRetry(2, networkError)).toBe(false)
  })

  it.each([500, 502, 503, 408, 429])('retries HTTP %i', (status) => {
    expect(shouldRetry(0, new HttpError(status))).toBe(true)
  })

  it.each([400, 404])('does not retry HTTP %i', (status) => {
    expect(shouldRetry(0, new HttpError(status))).toBe(false)
  })

  it('does not retry an unexpected error', () => {
    expect(shouldRetry(0, new SyntaxError('Unexpected token < in JSON'))).toBe(false)
  })
})
