import { createSSRApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import App from './App.vue'

// Une instance par requête : côté serveur, un état partagé fuiterait d'un utilisateur à l'autre.
export function createApp() {
  const app = createSSRApp(App)
  app.use(PrimeVue, {
    theme: {
      preset: Aura,
      // Thème clair uniquement : sans ça, Aura suit le mode sombre du système
      // alors que le reste de la page reste clair.
      options: { darkModeSelector: 'none' },
    },
  })
  return { app }
}
