import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glb'],
  build: {
    base:"./",
    rollupOptions: {
      external: [
        /^three\/examples\/jsm\/.*$/,
      ],
    },
  },
})