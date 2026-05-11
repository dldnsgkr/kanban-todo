import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'styled-system': fileURLToPath(new URL('./styled-system', import.meta.url)),
    },
  },
})
