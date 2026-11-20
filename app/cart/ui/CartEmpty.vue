<template>
  <!-- État vide partagé par le mini-panier et la page panier. -->
  <div class="flex flex-col items-center gap-2 py-6 text-center text-muted-color">
    <i class="pi pi-shopping-cart text-4xl" aria-hidden="true" />
    <p>Your cart is empty.</p>
    <slot />
  </div>
</template>
