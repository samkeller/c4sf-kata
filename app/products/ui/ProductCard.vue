<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import Rating from 'primevue/rating'
import Tag from 'primevue/tag'
import { toProductSearchParams } from '#shared/product-list.ts'
import type { Product } from '#shared/product.ts'
import AddToCartButton from '../../cart/ui/AddToCartButton.vue'
import { formatPrice } from '../../utils/format-price.ts'
import { highlightMatches } from '../domain/highlight.ts'
import { useProductQuery } from '../state/use-product-query.ts'

const props = defineProps<{
  product: Product
  /** Image visible dès l'arrivée de la page : chargée tout de suite et en priorité. */
  priority: boolean
}>()

const { query } = useProductQuery()

const titleSegments = computed(() => highlightMatches(props.product.title, query.value.q))

const categoryLink = computed(() => ({
  query: toProductSearchParams({ ...query.value, category: props.product.category.slug, page: 1 }),
}))
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
      <RouterLink :to="categoryLink" :aria-label="`Show only ${product.category.name}`">
        <Tag :value="product.category.name" severity="secondary" class="hover:bg-emphasis" />
      </RouterLink>
    </template>
    <template #title>
      <h2 class="line-clamp-2 text-base font-semibold">
        <template v-for="(segment, index) in titleSegments" :key="index">
          <mark v-if="segment.match" class="rounded-sm bg-primary-100 text-color">{{
            segment.text
          }}</mark>
          <template v-else>{{ segment.text }}</template>
        </template>
      </h2>
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
      <AddToCartButton :product="product" />
    </template>
  </Card>
</template>
