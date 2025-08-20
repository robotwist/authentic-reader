import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

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
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        devOptions: {
          enabled: true,
          type: 'module'
        },
        manifest: {
          name: 'Authentic Reader',
          short_name: 'AuthReader',
          description: 'Bias and logical fallacy focused reader with analysis',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          display_override: ['standalone', 'browser'],
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/authentic-internet-logo.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/authentic-internet-logo.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/authentic-internet-logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          navigateFallback: '/',
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/localhost:3000\/api\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60
                },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 300,
                  maxAgeSeconds: 7 * 24 * 60 * 60
                }
              }
            }
          ]
        }
      })
    ],
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
