export class HttpError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`HTTP ${status}`)
    this.name = 'HttpError'
    this.status = status
  }
}

/** Panne réseau (`fetch` rejette avec un `TypeError`), 5xx, 408 ou 429 : réessayer peut réussir. */
export function isTemporaryError(error: unknown): boolean {
  if (error instanceof TypeError) return true
  if (!(error instanceof HttpError)) return false
  return error.status >= 500 || error.status === 408 || error.status === 429
}
