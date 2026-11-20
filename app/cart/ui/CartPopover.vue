<script setup lang="ts">
import { computed, defineAsyncComponent, useTemplateRef } from 'vue'
import Button from 'primevue/button'
import Popover from 'primevue/popover'
import { useCartStore } from '../state/cart-store.ts'

// Chargé à la première ouverture : le mini-panier ne pèse pas sur le premier affichage.
const CartPreview = defineAsyncComponent(() => import('./CartPreview.vue'))

const cart = useCartStore()
const popover = useTemplateRef('popover')

// Pas de badge avant la restauration : le serveur ne connaît pas le panier, le badge
// apparaît après l'hydratation.
const badge = computed(() => (cart.restored && cart.count > 0 ? String(cart.count) : undefined))
</script>

<template>
  <div>
    <Button
      icon="pi pi-shopping-cart"
      label="Cart"
      severity="secondary"
      outlined
      :badge="badge"
      badge-severity="contrast"
      aria-haspopup="dialog"
      @click="popover?.toggle($event)"
    />
    <Popover ref="popover" :breakpoints="{ '640px': '90vw' }">
      <CartPreview @navigate="popover?.hide()" />
    </Popover>
  </div>
</template>
