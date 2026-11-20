<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'

// Page provisoire : le compteur sert seulement à vérifier que l'hydratation fonctionne.
const count = ref(0)
</script>

<template>
  <main>
    <h1>E-shop Gallery</h1>
    <Button :label="`Clicked ${count} times`" @click="count++" />
  </main>
</template>
