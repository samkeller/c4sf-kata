import type { LoadProductList } from './product-list.ts'

/** Ce que le serveur fournit à l'app pour un rendu. */
export interface RenderContext {
  loadProductList: LoadProductList
}

/** Résultat du rendu serveur, injecté dans `index.html` par le serveur. */
export interface RenderResult {
  /** Markup de l'application, remplace `<!--app-html-->`. */
  html: string
  /** Balises à ajouter dans `<head>`, remplace `<!--app-head-->`. */
  head: string
  /**
   * Cache Vue Query déshydraté, en JSON sûr à placer dans un `<script type="application/json">`.
   * Remplace `<!--app-state-->`.
   */
  state: string
}

/**
 * Contrat entre le serveur et `app/entry-server.ts`.
 * Partagé pour que le serveur n'ait pas à importer le code Vue pour le typer.
 */
export type RenderFn = (url: string, context: RenderContext) => Promise<RenderResult>
