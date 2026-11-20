import type { Cart, CartLine } from '#shared/cart.ts'
import type { Product } from '#shared/product.ts'

// Fonctions pures qui ne modifient jamais le panier reçu : le store garde ainsi intact le
// dernier panier confirmé, cible d'un rollback.

export function emptyCart(): Cart {
  return { lines: [] }
}

export function addProduct(cart: Cart, product: Product): Cart {
  const existing = cart.lines.find((line) => line.productId === product.id)
  if (existing) return setQuantity(cart, product.id, existing.quantity + 1)

  const line: CartLine = {
    productId: product.id,
    quantity: 1,
    title: product.title,
    unitPrice: product.price,
    image: product.image,
  }
  return { lines: [...cart.lines, line] }
}

export function setQuantity(cart: Cart, productId: number, quantity: number): Cart {
  const safeQuantity = Math.max(Math.trunc(quantity), 1)
  return {
    lines: cart.lines.map((line) =>
      line.productId === productId ? { ...line, quantity: safeQuantity } : line,
    ),
  }
}

export function removeLine(cart: Cart, productId: number): Cart {
  return { lines: cart.lines.filter((line) => line.productId !== productId) }
}

export function quantityOf(cart: Cart, productId: number): number {
  return cart.lines.find((line) => line.productId === productId)?.quantity ?? 0
}

export function incrementProduct(cart: Cart, productId: number): Cart {
  return setQuantity(cart, productId, quantityOf(cart, productId) + 1)
}

/** Sous 1, la ligne disparaît : retirer le dernier article retire le produit du panier. */
export function decrementProduct(cart: Cart, productId: number): Cart {
  const quantity = quantityOf(cart, productId)
  return quantity > 1 ? setQuantity(cart, productId, quantity - 1) : removeLine(cart, productId)
}

/**
 * Total d'une ligne. Les prix restent des nombres flottants, arrondis à l'affichage :
 * suffisant ici, puisque rien n'est payé. Un vrai paiement calculerait en centimes côté serveur.
 */
export function lineTotal(line: CartLine): number {
  return line.unitPrice * line.quantity
}

export function cartTotal(cart: Cart): number {
  return cart.lines.reduce((total, line) => total + lineTotal(line), 0)
}

export function itemCount(cart: Cart): number {
  return cart.lines.reduce((count, line) => count + line.quantity, 0)
}
