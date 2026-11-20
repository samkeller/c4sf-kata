<script setup lang="ts">
import Button from 'primevue/button'
import type { CartLine } from '#shared/cart.ts'
import { formatPrice } from '../../utils/format-price.ts'
import { lineTotal } from '../domain/cart.ts'
import { useCartStore } from '../state/cart-store.ts'
import QuantityStepper from './QuantityStepper.vue'

defineProps<{
  line: CartLine
  editable?: boolean
}>()

const cart = useCartStore()
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
    <img
      :src="line.image"
      alt=""
      width="64"
      height="64"
      :class="[
        'shrink-0 rounded-border border border-surface bg-surface-100',
        editable ? 'size-16' : 'size-12',
      ]"
    />
    <div class="min-w-0 flex-1">
      <p class="truncate font-medium">{{ line.title }}</p>
      <p class="text-sm text-muted-color">
        {{ formatPrice(line.unitPrice) }}
        <template v-if="!editable"> × {{ line.quantity }}</template>
      </p>
    </div>
    <div class="ml-auto flex items-center gap-3">
      <QuantityStepper
        v-if="editable"
        :quantity="line.quantity"
        :item-name="line.title"
        @increment="cart.increment(line.productId)"
        @decrement="cart.decrement(line.productId)"
      />
      <span class="w-20 text-right font-semibold">{{ formatPrice(lineTotal(line)) }}</span>
      <Button
        v-if="editable"
        icon="pi pi-trash"
        severity="danger"
        text
        rounded
        :aria-label="`Remove ${line.title}`"
        @click="cart.remove(line.productId)"
      />
    </div>
  </div>
</template>
