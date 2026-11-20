import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { useToast } from 'primevue/usetoast'
import type { Cart } from '#shared/cart.ts'
import type { Product } from '#shared/product.ts'
import { CART_STORAGE_KEY, readStoredCart, writeStoredCart } from '../api/cart-storage.ts'
import { saveCart } from '../api/save-cart.ts'
import {
  addProduct,
  cartTotal,
  decrementProduct,
  emptyCart,
  incrementProduct,
  itemCount,
  quantityOf,
  removeLine,
} from '../domain/cart.ts'

export type CartStatus = 'idle' | 'syncing' | 'error'

export const useCartStore = defineStore('cart', () => {
  const toast = useToast()

  // shallowRef : le domaine renvoie toujours un nouveau panier, la réactivité profonde est inutile.
  const cart = shallowRef<Cart>(emptyCart())
  let confirmed: Cart = emptyCart()
  const status = ref<CartStatus>('idle')
  /** `false` tant que `localStorage` n'a pas été lu (rendu serveur, avant l'hydratation). */
  const restored = ref(false)
  const simulateFailure = ref(false)
  let latestRequest = 0

  const lines = computed(() => cart.value.lines)
  const count = computed(() => itemCount(cart.value))
  const total = computed(() => cartTotal(cart.value))

  /**
   * Applique un changement de façon optimiste : affichage et sauvegarde locale immédiats,
   * puis confirmation du panier complet par le serveur.
   *
   * Seule la réponse à la dernière requête compte : une réponse arrivée après un changement
   * plus récent est ignorée. En cas d'échec, le panier revient au dernier état confirmé.
   */
  async function commit(next: Cart): Promise<void> {
    cart.value = next
    writeStoredCart(next)
    status.value = 'syncing'
    const request = ++latestRequest

    try {
      await saveCart(next, { simulateFailure: simulateFailure.value })
      if (request !== latestRequest) return
      confirmed = next
      status.value = 'idle'
    } catch {
      if (request !== latestRequest) return
      cart.value = confirmed
      // Le rollback est sauvegardé aussi : sinon un rechargement ferait revenir le changement refusé.
      writeStoredCart(confirmed)
      status.value = 'error'
      toast.add({
        severity: 'error',
        summary: 'Cart not saved',
        detail: 'Your last change could not be confirmed and was undone.',
        life: 5000,
      })
    }
  }

  function loadStoredCart(): void {
    const stored = readStoredCart()
    cart.value = stored
    confirmed = stored
  }

  /**
   * Navigateur uniquement, après l'hydratation : le serveur ne voit pas `localStorage`, et le
   * premier rendu client doit égaler le HTML serveur. Suit aussi les autres onglets.
   */
  function restore(): void {
    loadStoredCart()
    restored.value = true

    // La dernière écriture l'emporte : une réponse en attente ici sera ignorée.
    // `key` vaut null quand le stockage est vidé.
    window.addEventListener('storage', (event) => {
      if (event.key !== null && event.key !== CART_STORAGE_KEY) return
      latestRequest++
      loadStoredCart()
      status.value = 'idle'
    })
  }

  return {
    lines,
    count,
    total,
    status,
    restored,
    simulateFailure,
    restore,
    quantityOf: (productId: number) => quantityOf(cart.value, productId),
    add: (product: Product) => commit(addProduct(cart.value, product)),
    increment: (productId: number) => commit(incrementProduct(cart.value, productId)),
    decrement: (productId: number) => commit(decrementProduct(cart.value, productId)),
    remove: (productId: number) => commit(removeLine(cart.value, productId)),
  }
})
