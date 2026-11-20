<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Paginator from 'primevue/paginator'
import ProgressBar from 'primevue/progressbar'
import Skeleton from 'primevue/skeleton'
import { PAGE_SIZE } from '#shared/product-list.ts'
import { useProductList } from '../state/use-product-list.ts'
import { useProductQuery } from '../state/use-product-query.ts'
import ActiveFilters from './ActiveFilters.vue'
import ProductCard from './ProductCard.vue'
import ProductFilters from './ProductFilters.vue'

// Première ligne sur grand écran (lg:grid-cols-4) : visible dès l'arrivée, chargée en priorité.
const PRIORITY_IMAGES = 4
const SKELETON_CARDS = 8

const { status, products, total, categories, isUpdating, retry } = useProductList()
const { query, hasFilters, goToPage, clearFilters } = useProductQuery()

const firstIndex = computed(() => (query.value.page - 1) * PAGE_SIZE)
const resultCount = computed(() => `${total.value} ${total.value === 1 ? 'product' : 'products'}`)
</script>

<template>
  <section class="flex flex-col gap-4">
    <ProductFilters :categories="categories" />

    <div class="flex min-h-9 flex-wrap items-center gap-x-4 gap-y-2">
      <p v-if="status === 'success'" class="font-medium" aria-live="polite">{{ resultCount }}</p>
      <ActiveFilters :categories="categories" />
    </div>

    <!-- Hauteur réservée pour ne pas décaler la grille. -->
    <div class="h-1">
      <ProgressBar v-if="isUpdating" mode="indeterminate" class="h-1" />
    </div>

    <div
      v-if="status === 'pending'"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Loading products"
    >
      <Skeleton v-for="n in SKELETON_CARDS" :key="n" height="24rem" />
    </div>

    <Message v-else-if="status === 'error'" severity="error" icon="pi pi-exclamation-circle">
      <div class="flex items-center gap-4">
        <span>Products could not be loaded.</span>
        <Button
          label="Retry"
          icon="pi pi-refresh"
          size="small"
          severity="secondary"
          @click="retry"
        />
      </div>
    </Message>

    <div
      v-else-if="products.length === 0"
      class="flex flex-col items-center gap-3 py-16 text-center text-muted-color"
    >
      <i class="pi pi-search text-4xl" aria-hidden="true" />
      <p>No products match your search.</p>
      <Button
        v-if="hasFilters"
        label="Clear filters"
        icon="pi pi-filter-slash"
        @click="clearFilters"
      />
    </div>

    <template v-else>
      <ul
        class="grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        :class="{ 'opacity-50': isUpdating }"
        :aria-busy="isUpdating"
      >
        <li v-for="(product, index) in products" :key="product.id">
          <ProductCard :product="product" :priority="index < PRIORITY_IMAGES" />
        </li>
      </ul>

      <Paginator
        v-if="total > PAGE_SIZE"
        :rows="PAGE_SIZE"
        :total-records="total"
        :first="firstIndex"
        template="PrevPageLink PageLinks NextPageLink CurrentPageReport"
        current-page-report-template="{first}–{last} of {totalRecords}"
        class="bg-transparent"
        @page="({ page }) => goToPage(page + 1)"
      />
    </template>
  </section>
</template>
