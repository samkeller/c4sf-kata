/** Résultat du rendu serveur, injecté dans `index.html` par le serveur. */
export interface RenderResult {
  /** Markup de l'application, remplace `<!--app-html-->`. */
  html: string
  /** Balises à ajouter dans `<head>`, remplace `<!--app-head-->`. */
  head: string
}

/**
 * Contrat entre le serveur et `app/entry-server.ts`.
 * Partagé pour que le serveur n'ait pas à importer le code Vue pour le typer.
 */
export type RenderFn = (url: string) => Promise<RenderResult>
