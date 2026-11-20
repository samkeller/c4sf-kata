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
  <div class="flex w-80 max-w-full flex-col gap-3">
    <p class="font-semibold">Your cart</p>
    <CartEmpty v-if="cart.lines.length === 0" />
    <template v-else>
      <ul class="-mx-1 flex max-h-72 flex-col gap-3 overflow-auto px-1">
        <li v-for="line in cart.lines" :key="line.productId">
          <CartLineItem :line="line" />
        </li>
      </ul>
      <Divider class="my-0" />
      <CartSummary />
      <Button
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
