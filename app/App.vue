<script setup lang="ts">
import { ref } from 'vue'

// Page provisoire : le compteur sert seulement à vérifier que l'hydratation fonctionne.
const count = ref(0)
</script>

<template>
  <main>
    <h1>E-shop Gallery</h1>
    <button type="button" @click="count++">Clicked {{ count }} times</button>
  </main>
</template>
