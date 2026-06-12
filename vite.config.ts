import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' => chemins d'assets RELATIFS. Le site fonctionne quel que soit le
// nom du dépôt GitHub Pages (https://user.github.io/<repo>/), sans reconfig.
// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
})
