import { renderToString } from 'vue/server-renderer'
import BaseStyle from '@primevue/core/base/style'
import type { RenderFn } from '../shared/ssr.ts'
import { createApp } from './main.ts'

/** Méthodes des objets de style PrimeVue utilisées ici (absentes de leurs typages publics). */
interface PrimeVueStyle {
  name: string
  getStyleSheet: () => string | undefined
  getThemeStyleSheet: () => string | undefined
  getCommonThemeStyleSheet: () => string | undefined
}

function isPrimeVueStyle(value: unknown): value is PrimeVueStyle {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'getStyleSheet' in value &&
    'getThemeStyleSheet' in value &&
    'getCommonThemeStyleSheet' in value
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
    BaseStyle.getStyleSheet(),
    BaseStyle.getCommonThemeStyleSheet(),
    BaseStyle.getThemeStyleSheet(),
    ...[...styles].flatMap((style) => [style.getStyleSheet(), style.getThemeStyleSheet()]),
  ].join('')
}

export const render: RenderFn = async () => {
  const { app } = createApp()

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
  return { html, head: renderPrimeVueStyles(usedStyles) }
}
