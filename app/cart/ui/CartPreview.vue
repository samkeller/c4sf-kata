<script setup lang="ts">
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import { useCartStore } from '../state/cart-store.ts'
import CartEmpty from './CartEmpty.vue'
import CartLineItem from './CartLineItem.vue'
import CartSummary from './CartSummary.vue'

const emit = defineEmits<{ navigate: [] }>()

const cart = useCartStore()
</script>

<template>
  <div class="flex w-80 max-w-full flex-col">
    <p class="mb-3 font-semibold">Your cart</p>
    <CartEmpty v-if="cart.lines.length === 0" />
    <template v-else>
      <ul class="max-h-72 overflow-auto">
        <li v-for="(line, index) in cart.lines" :key="line.productId">
          <Divider v-if="index > 0" />
          <CartLineItem :line="line" />
        </li>
      </ul>
      <Divider />
      <CartSummary />
      <Button
        class="mt-4"
        as="router-link"
        to="/cart"
        label="Go to cart"
        icon="pi pi-arrow-right"
        icon-pos="right"
        @click="emit('navigate')"
      />
    </template>
  </div>
</template>
