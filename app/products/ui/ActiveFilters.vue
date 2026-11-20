<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Chip from 'primevue/chip'
import type { Category } from '#shared/product.ts'
import { formatPrice } from '../../utils/format-price.ts'
import { useProductQuery } from '../state/use-product-query.ts'

const props = defineProps<{ categories: Category[] }>()

const { query, hasFilters, updateFilters, clearFilters } = useProductQuery()

function priceRangeLabel(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) return `${formatPrice(min)} – ${formatPrice(max)}`
  if (min !== undefined) return `From ${formatPrice(min)}`
  return `Up to ${formatPrice(max ?? 0)}`
}

const chips = computed(() => {
  const { q, category, minPrice, maxPrice } = query.value
  const active: { key: string; label: string; remove: () => void }[] = []
  if (q) active.push({ key: 'q', label: `“${q}”`, remove: () => updateFilters({ q: undefined }) })
  if (category) {
    const name = props.categories.find((c) => c.slug === category)?.name ?? category
    active.push({
      key: 'category',
      label: name,
      remove: () => updateFilters({ category: undefined }),
    })
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    active.push({
      key: 'price',
      label: priceRangeLabel(minPrice, maxPrice),
      remove: () => updateFilters({ minPrice: undefined, maxPrice: undefined }),
    })
  }
  return active
})
</script>

<template>
  <div v-if="hasFilters" class="flex flex-wrap items-center gap-2">
    <Chip
      v-for="chip in chips"
      :key="chip.key"
      :label="chip.label"
      removable
      :pt="{ removeIcon: { 'aria-label': `Remove filter ${chip.label}` } }"
      @remove="chip.remove()"
    />
    <Button label="Clear all" severity="secondary" text size="small" @click="clearFilters" />
  </div>
</template>
