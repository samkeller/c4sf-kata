<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import type { Product } from '#shared/product.ts'
import { useCartStore } from '../state/cart-store.ts'
import QuantityStepper from './QuantityStepper.vue'

const props = defineProps<{ product: Product }>()

const cart = useCartStore()
const toast = useToast()

const quantity = computed(() => cart.quantityOf(props.product.id))

function add() {
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
  <QuantityStepper
    v-if="quantity > 0"
    :quantity="quantity"
    :item-name="product.title"
    fluid
    @increment="cart.increment(product.id)"
    @decrement="cart.decrement(product.id)"
  />
  <Button v-else icon="pi pi-cart-plus" label="Add to cart" fluid @click="add" />
</template>
