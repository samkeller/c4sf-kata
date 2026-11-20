import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { useToast } from 'primevue/usetoast'
import type { Cart } from '#shared/cart.ts'
import type { Product } from '#shared/product.ts'
import { readStoredCart, writeStoredCart } from '../api/cart-storage.ts'
import { saveCart } from '../api/save-cart.ts'
import {
  addProduct,
  cartTotal,
  emptyCart,
  itemCount,
  removeLine,
  setQuantity as setLineQuantity,
} from '../domain/cart.ts'

export type CartStatus = 'idle' | 'syncing' | 'error'

export const useCartStore = defineStore('cart', () => {
  const toast = useToast()

  // shallowRef : le domaine renvoie toujours un nouveau panier, inutile de rendre chaque
  // ligne réactive en profondeur.
  const cart = shallowRef<Cart>(emptyCart())
  /** Dernier panier confirmé par le serveur : la cible d'un rollback. */
  let confirmed: Cart = emptyCart()
  const status = ref<CartStatus>('idle')
  /** `false` tant que `localStorage` n'a pas été lu : on ne sait pas encore ce que contient le panier. */
  const restored = ref(false)
  /** Démo : fait échouer les prochaines confirmations. */
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

  /**
   * Restaure le panier depuis `localStorage`. Navigateur uniquement, après l'hydratation :
   * le serveur ne voit pas ce stockage, et le premier rendu client doit égaler le HTML serveur.
   */
  function restore(): void {
    const stored = readStoredCart()
    cart.value = stored
    // Le navigateur est la source de vérité : ce qu'il a gardé fait référence.
    confirmed = stored
    restored.value = true
  }

  return {
    lines,
    count,
    total,
    status,
    restored,
    simulateFailure,
    restore,
    add: (product: Product) => commit(addProduct(cart.value, product)),
    setQuantity: (productId: number, quantity: number) =>
      commit(setLineQuantity(cart.value, productId, quantity)),
    remove: (productId: number) => commit(removeLine(cart.value, productId)),
  }
})
