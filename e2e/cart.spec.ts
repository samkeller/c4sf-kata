import { expect, test } from '@playwright/test'

test('a product added to the cart is still there after a reload', async ({ page }) => {
  // Confirmation lente : le rechargement tombe pendant le PUT, le cas qui effaçait l'ajout.
  // `continue` échoue une fois la page rechargée, ce qui est attendu.
  await page.route('**/api/cart', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await route.continue().catch(() => {})
  })

  await page.goto('/')
  // Un clic avant l'hydratation tomberait sur le HTML serveur, encore inerte.
  await page.waitForLoadState('networkidle')
  const title = await page.getByRole('heading', { level: 2 }).first().textContent()
  if (!title) throw new Error('No product on the page')

  await page.getByRole('button', { name: 'Add to cart' }).first().click()
  await expect(page.getByRole('button', { name: `Remove ${title}` })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', { name: `Remove ${title}` })).toBeVisible()

  await page.goto('/cart')
  await expect(page.getByText(title)).toBeVisible()
})
