import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Define environment variables for the build
  const envWithProcessPrefix = {
    'process.env.NODE_ENV': `"${mode}"`,
    'process.env.VITE_APP_TITLE': '"Authentic Reader"'
  }

  return {
    // Ensure absolute paths for assets
    base: '/',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Authentic Reader',
          short_name: 'AuthenticReader',
          description: 'AI-powered news analysis and bias detection',
          theme_color: '#1a1a2e',
          background_color: '#16213e',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/.*\/api\//,
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
      // Disable sourcemaps in production to speed up build
      sourcemap: mode === 'development',
      // Increase chunk size limit
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor libraries into separate chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            'chart-vendor': ['recharts'],
            'utils-vendor': ['axios', 'dompurify']
          }
        }
      },
      // Use esbuild for faster minification
      minify: 'esbuild',
      // Optimize build performance
      target: 'esnext',
      cssCodeSplit: true
    },
    server: {
      // Configure dev server if needed
      port: 5173,
      open: true,
      cors: true,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom']
    }
  }
})
