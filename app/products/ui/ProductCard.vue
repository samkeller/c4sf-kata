<script setup lang="ts">
import Card from 'primevue/card'
import Rating from 'primevue/rating'
import type { Product } from '#shared/product.ts'

const props = defineProps<{
  product: Product
  /** Image visible dès l'arrivée de la page : chargée tout de suite et en priorité. */
  priority: boolean
}>()

// Locale fixe : celle du système varierait entre le serveur et le navigateur,
// et le prix formaté ne correspondrait plus à l'hydratation.
const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
  props.product.price,
)
</script>

<template>
  <Card class="h-full overflow-hidden">
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
    <template #title>
      <h2 class="text-base font-semibold">{{ product.title }}</h2>
    </template>
    <template #content>
      <p class="mb-2 text-lg font-bold">{{ price }}</p>
      <!-- Une <div> et pas un <p> : Rating rend une <div>, que le navigateur sortirait d'un <p>
           en lisant le HTML serveur (mismatch d'hydratation). -->
      <div class="flex items-center gap-2 text-sm text-muted-color">
        <!-- Étoiles décoratives : `inert` retire leurs radios du focus et de l'accessibilité,
             la note chiffrée suffit aux lecteurs d'écran. -->
        <Rating :model-value="Math.round(product.rating)" readonly inert />
        <span><span class="sr-only">Rated </span>{{ product.rating.toFixed(1) }}</span>
      </div>
    </template>
  </Card>
</template>
