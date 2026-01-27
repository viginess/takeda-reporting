import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@trpc/server/observable': path.resolve(
        __dirname,
        'node_modules/@trpc/server/dist/observable/index.mjs'
      ),
      '@trpc/server/shared': path.resolve(
        __dirname,
        'node_modules/@trpc/server/dist/shared.mjs'
      ),
    },
  },
  optimizeDeps: {
    include: [
      '@trpc/server',
      '@trpc/server/observable',
      '@trpc/server/shared',
    ],
    exclude: ['@trpc/client', '@trpc/react-query'],
  },
})
