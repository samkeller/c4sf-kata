import { expect, test } from '@playwright/test'

// JavaScript désactivé : tout ce qui s'affiche vient du HTML rendu par le serveur.
test.use({ javaScriptEnabled: false })

test('the product list is rendered by the server', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('194 products')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(20)
  await expect(page.getByRole('button', { name: 'Add to cart' }).first()).toBeVisible()
})
