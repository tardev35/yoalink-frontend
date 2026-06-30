import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // เพิ่มบรรทัดนี้

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), // เพิ่มบรรทัดนี้
    react(),
  ],
})