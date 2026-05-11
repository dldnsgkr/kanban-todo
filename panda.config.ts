import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'],
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  globalCss: {
    'html, body': {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      color: '#1e293b',
      WebkitFontSmoothing: 'antialiased',
    },
    button: { fontFamily: 'inherit' },
  },
  theme: {
    extend: {},
  },
  outdir: 'styled-system',
})
