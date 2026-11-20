import { describe, expect, it } from 'vitest'
import { render } from './entry-server.ts'

describe('render', () => {
  it('renders the app markup on the server', async () => {
    const { html } = await render('/')

    expect(html).toContain('<h1>E-shop Gallery</h1>')
    expect(html).toContain('Clicked 0 times')
  })

  it('inlines the theme and the styles of the PrimeVue components it rendered', async () => {
    const { head } = await render('/')

    expect(head).toContain('data-primevue-style-id="semantic-variables"')
    expect(head).toContain('data-primevue-style-id="button-variables"')
    expect(head).toContain('data-primevue-style-id="button-style"')
  })

  it('gives the same output for every request', async () => {
    // Un état partagé entre requêtes (compteur d'ids, styles déjà marqués comme chargés)
    // ferait diverger le deuxième rendu et casserait l'hydratation.
    const first = await render('/')
    const second = await render('/')

    expect(second).toEqual(first)
  })
})
