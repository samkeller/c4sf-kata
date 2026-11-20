/**
 * Prix en dollars (DummyJSON), arrondi au centime pour l'affichage.
 */
export function formatPrice(price: number): string {
  const priceFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

  return priceFormat.format(price)
}
