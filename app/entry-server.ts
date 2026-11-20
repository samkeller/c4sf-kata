import { renderToString } from 'vue/server-renderer'
import { createMemoryHistory } from 'vue-router'
import BaseStyle from '@primevue/core/base/style'
import { dehydrate, defaultShouldDehydrateQuery, type DehydratedState } from '@tanstack/vue-query'
import type { RenderFn } from '#shared/ssr.ts'
import { createApp } from './main.ts'

/** Méthodes des objets de style PrimeVue utilisées ici (absentes de leurs typages publics). */
interface PrimeVueStyle {
  name: string
  getStyleSheet: () => string | undefined
  getThemeStyleSheet: () => string | undefined
  getCommonThemeStyleSheet: () => string | undefined
  getLayerOrderThemeCSS: () => string
}

function isPrimeVueStyle(value: unknown): value is PrimeVueStyle {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'getStyleSheet' in value &&
    'getThemeStyleSheet' in value &&
    'getCommonThemeStyleSheet' in value &&
    'getLayerOrderThemeCSS' in value
  )
}

/**
 * Sérialise en balises `<style>` le CSS des composants PrimeVue rendus.
 * Les attributs `data-primevue-style-id` permettent au client de réutiliser
 * ces balises à l'hydratation au lieu de les dupliquer.
 */
function renderPrimeVueStyles(styles: ReadonlySet<PrimeVueStyle>): string {
  if (styles.size === 0 || !isPrimeVueStyle(BaseStyle)) return ''
  return [
    // L'ordre des couches doit précéder toute autre déclaration `@layer`, y compris celles du
    // CSS Tailwind chargé ensuite. Sinon la couche `primevue` deviendrait la moins prioritaire
    // et le preflight Tailwind écraserait les composants jusqu'à l'hydratation.
    `<style type="text/css" data-primevue-style-id="layer-order">${BaseStyle.getLayerOrderThemeCSS()}</style>`,
    BaseStyle.getStyleSheet(),
    BaseStyle.getCommonThemeStyleSheet(),
    BaseStyle.getThemeStyleSheet(),
    ...[...styles].flatMap((style) => [style.getStyleSheet(), style.getThemeStyleSheet()]),
  ].join('')
}

/**
 * Sérialise le cache pour un `<script type="application/json">`. Ce bloc n'est pas exécuté,
 * donc compatible avec la CSP `script-src 'self'`. Les `<` sont échappés : la query key et
 * les titres viennent de l'extérieur, et un `</script>` fermerait la balise (XSS).
 */
function serializeState(state: DehydratedState): string {
  return JSON.stringify(state).replaceAll('<', '\\u003c')
}

export const render: RenderFn = async (url, { loadProductList }) => {
  const { app, queryClient, router } = createApp({
    loadProductList,
    history: createMemoryHistory(),
  })
  await router.push(url)
  // Attend la résolution de la route, y compris le chargement d'un composant lazy (/cart).
  await router.isReady()

  // PrimeVue injecte son CSS dans `beforeMount`, qui ne s'exécute pas côté serveur.
  // On relève donc les styles des composants rendus pour les mettre dans le <head>,
  // sinon la page s'afficherait sans style jusqu'au chargement du JS.
  const usedStyles = new Set<PrimeVueStyle>()
  app.mixin({
    created() {
      const style: unknown = 'style' in this.$options ? this.$options.style : undefined
      if (isPrimeVueStyle(style)) usedStyles.add(style)
    },
  })

  const html = await renderToString(app)

  const state = dehydrate(queryClient, {
    // Une requête en échec est rendue en état d'erreur : il faut la transmettre aussi,
    // sinon le client démarrerait en chargement et l'hydratation ne correspondrait pas.
    shouldDehydrateQuery: (query) =>
      defaultShouldDehydrateQuery(query) || query.state.status === 'error',
  })
  // Le gcTime arme un timer par requête : sans ça, ce client resterait en mémoire 30 min.
  queryClient.clear()

  return { html, head: renderPrimeVueStyles(usedStyles), state: serializeState(state) }
}
