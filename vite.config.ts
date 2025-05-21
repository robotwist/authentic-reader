import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Expose REACT_APP_ variables as import.meta.env.REACT_APP_*
  const envWithProcessPrefix = Object.entries(env).reduce(
    (prev, [key, val]) => {
      return {
        ...prev,
        ["import.meta.env." + key]: JSON.stringify(val),
        ["process.env." + key]: JSON.stringify(val),
      }
    },
    {}
  )

  return {
    plugins: [react()],
    define: envWithProcessPrefix,
    // Enable more detailed error messages in development
    build: {
      sourcemap: true,
    },
    server: {
      // Configure dev server if needed
      port: 5173,
      open: true,
      cors: true,
    },
  }
})
