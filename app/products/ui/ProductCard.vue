<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import Rating from 'primevue/rating'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import type { Product } from '#shared/product.ts'
import { useCartStore } from '../../cart/state/cart-store.ts'
import { formatPrice } from '../../utils/format-price.ts'

const props = defineProps<{
  product: Product
  /** Image visible dès l'arrivée de la page : chargée tout de suite et en priorité. */
  priority: boolean
}>()

const cart = useCartStore()
const toast = useToast()

function addToCart() {
  // Retour immédiat : le panier est déjà à jour, la confirmation serveur suit en arrière-plan.
  void cart.add(props.product)
  toast.add({
    severity: 'success',
    summary: 'Added to cart',
    detail: props.product.title,
    life: 2000,
  })
}
</script>

<template>
  <!-- Corps extensible et pied collé en bas : les boutons s'alignent d'une carte à l'autre. -->
  <Card
    class="h-full overflow-hidden transition-shadow hover:shadow-lg"
    :pt="{ body: { class: 'flex-1' }, footer: { class: 'mt-auto' } }"
  >
    <template #header>
      <!-- Dimensions réelles des vignettes DummyJSON : la place est réservée avant le chargement. -->
      <img
        :src="product.image"
        :alt="product.title"
        width="300"
        height="300"
        :loading="priority ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : 'auto'"
        class="h-auto w-full bg-surface-100"
      />
    </template>
    <template #subtitle>
      <Tag :value="product.category" severity="secondary" class="capitalize" />
    </template>
    <template #title>
      <h2 class="line-clamp-2 text-base font-semibold">{{ product.title }}</h2>
    </template>
    <template #content>
      <!-- Des <div> et pas de <p> autour de Rating : il rend une <div>, que le navigateur sortirait
           d'un <p> en lisant le HTML serveur (mismatch d'hydratation). -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">{{ formatPrice(product.price) }}</span>
        <div class="flex items-center gap-1 text-sm text-muted-color">
          <!-- Étoiles décoratives : `inert` retire leurs radios du focus et de l'accessibilité,
               la note chiffrée suffit aux lecteurs d'écran. -->
          <Rating :model-value="Math.round(product.rating)" readonly inert />
          <span><span class="sr-only">Rated </span>{{ product.rating.toFixed(1) }}</span>
        </div>
      </div>
    </template>
    <template #footer>
      <Button icon="pi pi-cart-plus" label="Add to cart" class="w-full" @click="addToCart" />
    </template>
  </Card>
</template>
