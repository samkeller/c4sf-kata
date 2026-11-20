<script setup lang="ts">
import { formatPrice } from '../../utils/format-price.ts'
import { useCartStore } from '../state/cart-store.ts'

const cart = useCartStore()
</script>

<template>
  <div class="flex items-baseline justify-between gap-4">
    <span class="text-muted-color">
      Total ({{ cart.count }} {{ cart.count === 1 ? 'item' : 'items' }})
    </span>
    <span class="text-lg font-bold">{{ formatPrice(cart.total) }}</span>
  </div>
</template>
