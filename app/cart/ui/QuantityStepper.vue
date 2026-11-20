<script setup lang="ts">
import Button from 'primevue/button'

defineProps<{
  quantity: number
  /** Nom de l'article, pour les libellés accessibles des boutons. */
  itemName: string
  fluid?: boolean
}>()

const emit = defineEmits<{ increment: []; decrement: [] }>()
</script>

<template>
  <!-- Mêmes couleur et hauteur que « Add to cart », que ce stepper remplace. -->
  <div
    class="inline-flex items-center overflow-hidden rounded-border bg-primary text-primary-contrast"
    :class="{ 'w-full justify-between': fluid }"
  >
    <!-- À 1, décrémenter retire l'article : l'icône le dit avant le clic. -->
    <Button
      :icon="quantity === 1 ? 'pi pi-trash' : 'pi pi-minus'"
      :aria-label="quantity === 1 ? `Remove ${itemName}` : `One less ${itemName}`"
      @click="emit('decrement')"
    />
    <span class="min-w-10 text-center font-semibold tabular-nums" aria-live="polite">
      {{ quantity }}
    </span>
    <Button icon="pi pi-plus" :aria-label="`One more ${itemName}`" @click="emit('increment')" />
  </div>
</template>
