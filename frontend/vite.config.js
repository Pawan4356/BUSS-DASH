import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // .env lives at the monorepo root (one file shared with Express/FastAPI),
  // not in this package — see README.md › Getting started.
  envDir: '../',
  server: {
    port: 5173,
  },
})
