<script setup lang="ts">
import ProductList from './products/ui/ProductList.vue'
</script>

<template>
  <div class="min-h-screen bg-surface-50 text-color">
    <header class="border-b border-surface bg-surface-0">
      <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <img src="/carrefour.svg" alt="Carrefour" width="61" height="40" class="h-8 w-auto" />
        <h1 class="text-xl font-semibold">E-shop Gallery</h1>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-6">
      <ProductList />
    </main>
  </div>
</template>
