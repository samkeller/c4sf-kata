/**
 * La source de données a répondu, mais avec des données non conformes au schéma attendu.
 * Le nom ne cite aucune source : les routes l'attrapent sans dépendre de DummyJSON.
 */
export class UpstreamDataError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'UpstreamDataError'
  }
}

/** La source de données n'a pas pu répondre : réseau, timeout ou statut HTTP en erreur. */
export class UpstreamUnavailableError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'UpstreamUnavailableError'
  }
}
