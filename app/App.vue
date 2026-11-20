<script setup lang="ts">
import Toast from 'primevue/toast'
import CartPopover from './cart/ui/CartPopover.vue'
</script>

<template>
  <div class="min-h-screen bg-surface-50 text-color">
    <header class="sticky top-0 z-10 border-b border-surface bg-surface-0/95 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <RouterLink to="/" class="flex items-center gap-3">
          <img src="/carrefour.svg" alt="Carrefour" width="61" height="40" class="h-8 w-auto" />
          <h1 class="text-xl font-semibold">E-shop Gallery</h1>
        </RouterLink>
        <CartPopover class="ml-auto" />
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-6">
      <RouterView />
    </main>
    <!-- Toast global en bas à droite : il ne masque ni le header ni le bouton panier. -->
    <Toast position="bottom-right" />
  </div>
</template>
