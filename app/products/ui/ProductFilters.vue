<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import FloatLabel from 'primevue/floatlabel'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import type { Category } from '#shared/product.ts'
import { useProductQuery, type ProductFilters } from '../state/use-product-query.ts'

defineProps<{ categories: Category[] }>()

// Pas une requête (ni une entrée d'historique) par touche.
const TYPING_DELAY_MS = 300

const { query, updateFilters } = useProductQuery()

const search = ref(query.value.q ?? '')
const minPrice = ref<number | null>(query.value.minPrice ?? null)
const maxPrice = ref<number | null>(query.value.maxPrice ?? null)

const invalidPriceRange = computed(
  () => minPrice.value !== null && maxPrice.value !== null && minPrice.value > maxPrice.value,
)

let pendingUpdate: ReturnType<typeof setTimeout> | undefined

function applyTypedFilters() {
  clearTimeout(pendingUpdate)
  pendingUpdate = undefined
  const changes: Partial<ProductFilters> = { q: search.value.trim() || undefined }
  if (!invalidPriceRange.value) {
    changes.minPrice = minPrice.value ?? undefined
    changes.maxPrice = maxPrice.value ?? undefined
  }
  void updateFilters(changes)
}

function applyAfterTyping() {
  clearTimeout(pendingUpdate)
  pendingUpdate = setTimeout(applyTypedFilters, TYPING_DELAY_MS)
}

// Les champs suivent l'URL (précédent, filtre retiré…), sauf pendant une saisie en cours,
// qui serait sinon écrasée par l'URL de la frappe précédente.
watch(query, (current) => {
  if (pendingUpdate !== undefined) return
  search.value = current.q ?? ''
  minPrice.value = current.minPrice ?? null
  maxPrice.value = current.maxPrice ?? null
})

onBeforeUnmount(() => clearTimeout(pendingUpdate))
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_16rem_9rem_9rem]">
    <FloatLabel variant="on" class="sm:col-span-2 lg:col-span-1">
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText
          id="search"
          v-model="search"
          type="search"
          autocomplete="off"
          fluid
          @update:model-value="applyAfterTyping"
          @keydown.enter="applyTypedFilters"
        />
      </IconField>
      <label for="search">Search products</label>
    </FloatLabel>

    <FloatLabel variant="on">
      <Select
        input-id="category"
        :model-value="query.category"
        :options="categories"
        option-label="name"
        option-value="slug"
        filter
        show-clear
        fluid
        @update:model-value="
          (slug?: string | null) => updateFilters({ category: slug ?? undefined })
        "
      />
      <label for="category">Category</label>
    </FloatLabel>

    <FloatLabel variant="on">
      <InputNumber
        v-model="minPrice"
        input-id="min-price"
        mode="currency"
        currency="USD"
        locale="en-US"
        :min="0"
        :invalid="invalidPriceRange"
        fluid
        @update:model-value="applyAfterTyping"
      />
      <label for="min-price">Min price</label>
    </FloatLabel>

    <FloatLabel variant="on">
      <InputNumber
        v-model="maxPrice"
        input-id="max-price"
        mode="currency"
        currency="USD"
        locale="en-US"
        :min="0"
        :invalid="invalidPriceRange"
        fluid
        @update:model-value="applyAfterTyping"
      />
      <label for="max-price">Max price</label>
    </FloatLabel>

    <Message
      v-if="invalidPriceRange"
      severity="error"
      size="small"
      variant="simple"
      class="sm:col-span-2 lg:col-span-4 lg:text-right"
    >
      The min price is above the max price.
    </Message>
  </div>
</template>
