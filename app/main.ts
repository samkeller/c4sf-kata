import { createSSRApp } from 'vue'
import App from './App.vue'

// Une instance par requête : côté serveur, un état partagé fuiterait d'un utilisateur à l'autre.
export function createApp() {
  const app = createSSRApp(App)
  return { app }
}
