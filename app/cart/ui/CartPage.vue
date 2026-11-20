<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import Skeleton from 'primevue/skeleton'
import ToggleSwitch from 'primevue/toggleswitch'
import type { CartStatus } from '../state/cart-store.ts'
import { useCartStore } from '../state/cart-store.ts'
import CartEmpty from './CartEmpty.vue'
import CartLineItem from './CartLineItem.vue'
import CartSummary from './CartSummary.vue'

const cart = useCartStore()

const statusDisplay: Record<CartStatus, { icon: string; text: string }> = {
  idle: { icon: 'pi pi-check-circle text-primary', text: 'All changes saved' },
  syncing: { icon: 'pi pi-spin pi-spinner', text: 'Saving…' },
  error: { icon: 'pi pi-exclamation-triangle text-red-500', text: 'Last change undone' },
}
const status = computed(() => statusDisplay[cart.status])
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="flex items-center justify-between gap-4">
      <h2 class="text-2xl font-semibold">Your cart</h2>
      <Button
        as="router-link"
        to="/"
        label="Continue shopping"
        icon="pi pi-arrow-left"
        severity="secondary"
        text
      />
    </div>

    <!-- Le serveur ne connaît pas le panier : un squelette jusqu'à la restauration. -->
    <Skeleton v-if="!cart.restored" height="12rem" />

    <Card v-else-if="cart.lines.length === 0">
      <template #content>
        <CartEmpty>
          <Button as="router-link" to="/" label="Browse products" icon="pi pi-th-large" />
        </CartEmpty>
      </template>
    </Card>

    <div v-else class="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
      <Card>
        <template #content>
          <ul>
            <li v-for="(line, index) in cart.lines" :key="line.productId">
              <Divider v-if="index > 0" />
              <CartLineItem :line="line" editable />
            </li>
          </ul>
        </template>
      </Card>

      <Card class="lg:sticky lg:top-24">
        <template #title>Summary</template>
        <template #content>
          <CartSummary />
          <p class="mt-3 flex items-center gap-2 text-sm text-muted-color" aria-live="polite">
            <i :class="status.icon" aria-hidden="true" />
            {{ status.text }}
          </p>
          <Divider />
          <label class="flex items-center justify-between gap-2 text-sm text-muted-color">
            Simulate sync failure (demo)
            <ToggleSwitch v-model="cart.simulateFailure" />
          </label>
        </template>
      </Card>
    </div>
  </section>
</template>
