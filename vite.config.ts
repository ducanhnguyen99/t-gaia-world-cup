import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves project sites under /<repo>/.
// HashRouter handles client-side routing; assets resolve against this base.
// https://vite.dev/config/
export default defineConfig({
  base: '/t-gaia-world-cup/',
  plugins: [react(), tailwindcss()],
})
