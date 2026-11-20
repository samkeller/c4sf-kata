<script setup lang="ts">
import Button from 'primevue/button'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import { useProductList } from '../state/use-product-list.ts'
import ProductCard from './ProductCard.vue'

// Nombre de colonnes sur grand écran (lg:grid-cols-4) : ces images sont visibles dès
// l'arrivée de la page, les suivantes sont chargées à l'approche du scroll.
const PRIORITY_IMAGES = 4
const SKELETON_CARDS = 8

const { status, products, retry } = useProductList()
</script>

<template>
  <div
    v-if="status === 'pending'"
    class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    aria-busy="true"
    aria-label="Loading products"
  >
    <Skeleton v-for="n in SKELETON_CARDS" :key="n" height="24rem" />
  </div>

  <Message v-else-if="status === 'error'" severity="error">
    <div class="flex items-center gap-4">
      <span>Products could not be loaded.</span>
      <Button label="Retry" size="small" severity="secondary" @click="retry" />
    </div>
  </Message>

  <Message v-else-if="products.length === 0" severity="secondary">No products found.</Message>

  <ul v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
    <li v-for="(product, index) in products" :key="product.id">
      <ProductCard :product="product" :priority="index < PRIORITY_IMAGES" />
    </li>
  </ul>
</template>
