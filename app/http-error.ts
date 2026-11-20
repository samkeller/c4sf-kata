/** Notre API a répondu avec un statut HTTP en erreur. */
export class HttpError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`HTTP ${status}`)
    this.name = 'HttpError'
    this.status = status
  }
}

/**
 * Indique si une nouvelle tentative a des chances de réussir.
 *
 * Temporaire : panne réseau (`fetch` rejette alors avec un `TypeError`), statut 5xx
 * (dont le 502 renvoyé quand la source du catalogue est indisponible), 408 et 429.
 * Les autres 4xx et les erreurs de code ne changeront pas en réessayant.
 */
export function isTemporaryError(error: unknown): boolean {
  if (error instanceof TypeError) return true
  if (!(error instanceof HttpError)) return false
  return error.status >= 500 || error.status === 408 || error.status === 429
}
