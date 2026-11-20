import { cartSchema, type Cart } from '#shared/cart.ts'
import { emptyCart } from '../domain/cart.ts'

/** Clé versionnée : un futur format changera de clé au lieu de relire l'ancien. */
export const CART_STORAGE_KEY = 'cart:v1'

/**
 * Relit le panier sauvegardé. Une donnée absente, illisible ou d'un autre format
 * donne un panier vide : un stockage corrompu ne doit jamais casser l'app.
 */
export function readStoredCart(): Cart {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (raw === null) return emptyCart()
    const cart = cartSchema.safeParse(JSON.parse(raw))
    return cart.success ? cart.data : emptyCart()
  } catch {
    // JSON invalide, ou stockage inaccessible (navigation privée, cookies bloqués).
    return emptyCart()
  }
}

export function writeStoredCart(cart: Cart): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  } catch {
    // Quota dépassé ou stockage bloqué : le panier reste utilisable, sans persistance.
  }
}
