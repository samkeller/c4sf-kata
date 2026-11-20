<script setup lang="ts">
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import type { CartLine } from '#shared/cart.ts'
import { formatPrice } from '../../utils/format-price.ts'
import { lineTotal } from '../domain/cart.ts'
import { useCartStore } from '../state/cart-store.ts'

const props = defineProps<{
  line: CartLine
  editable?: boolean
}>()

const cart = useCartStore()

function updateQuantity(quantity: number | null) {
  // Champ vidé pendant la saisie : on attend une valeur plutôt que de supprimer la ligne.
  if (quantity !== null) void cart.setQuantity(props.line.productId, quantity)
}
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
      <InputNumber
        v-if="editable"
        :model-value="line.quantity"
        show-buttons
        button-layout="horizontal"
        :min="1"
        :allow-empty="false"
        size="small"
        input-class="w-10 text-center"
        increment-button-icon="pi pi-plus"
        decrement-button-icon="pi pi-minus"
        :aria-label="`Quantity of ${line.title}`"
        @update:model-value="updateQuantity"
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
