import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { getNameAudio } from './server/namesAudio.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Mock the Vercel serverless function for local development
  const localApiProxy = () => ({
    name: 'local-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/names-audio', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.setHeader('Allow', 'GET')
          return res.end(JSON.stringify({ error: 'Method not allowed' }))
        }

        const url = new URL(req.originalUrl, 'http://localhost')
        const rawNumber = url.searchParams.get('number')
        const number = rawNumber === null ? NaN : Number(rawNumber)

        try {
          const { audio, contentType } = await getNameAudio(number)
          res.statusCode = 200
          res.setHeader('Content-Type', contentType)
          res.setHeader('Cache-Control', 'public, max-age=86400')
          res.end(Buffer.from(audio))
        } catch (error) {
          res.statusCode = error instanceof RangeError ? 400 : 502
          res.setHeader('Content-Type', 'application/json')
          if (res.statusCode === 502) console.error('Names audio proxy failed:', error)
          res.end(JSON.stringify({ error: error.message }))
        }
      })

      server.middlewares.use('/api/youtube', async (req, res) => {
        try {
          const urlObj = new URL(req.originalUrl, 'http://localhost')
          const params = Object.fromEntries(urlObj.searchParams)
          const endpoint = params.endpoint

          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')

          if (!endpoint) {
            res.statusCode = 400
            return res.end(JSON.stringify({ error: 'Missing endpoint' }))
          }

          const allowed = ['channels', 'search', 'videos', 'playlistItems']
          if (!allowed.includes(endpoint)) {
            res.statusCode = 403
            return res.end(JSON.stringify({ error: 'Forbidden' }))
          }

          const key = env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY
          if (!key) {
            res.statusCode = 500
            return res.end(JSON.stringify({ error: 'API key not configured' }))
          }

          const targetUrl = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`)
          targetUrl.searchParams.set('key', key)
          for (const [k, v] of Object.entries(params)) {
            if (k !== 'endpoint') targetUrl.searchParams.set(k, v)
          }

          const response = await fetch(targetUrl.toString())
          const data = await response.json()

          res.statusCode = response.status
          res.end(JSON.stringify(data))
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    }
  })

  return {
    server: {
      proxy: {
        // Forward backend auth / history / device API calls to the local Express backend.
        '/api/auth':    { target: 'http://localhost:5000', changeOrigin: true },
        '/api/history': { target: 'http://localhost:5000', changeOrigin: true },
        '/api/device':  { target: 'http://localhost:5000', changeOrigin: true },
      },
    },
    plugins: [
      react(),
      localApiProxy(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'channels4_profile.jpg', 'logo-192.png', 'logo-512.png'],
        manifest: {
          name: 'Peace be upon him',
          short_name: 'Peace',
          description: 'Tamil Islamic Knowledge Platform',
          theme_color: '#0e382b',
          background_color: '#0e382b',
          display: 'standalone',
          icons: [
            {
              src: '/logo-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/logo-512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/logo-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          // Precache all bundled Quran JSON files so they are available offline
          // immediately after PWA installation (no prior visit needed)
          globPatterns: [
            '**/*.{js,css,html,svg,png,jpg,ico,woff,woff2}',
            'api/quran/chapters.json',
            'api/quran/*.json',
            'api/duas.json',
            'api/dhikr.json',
          ],
          // Large JSON files — increase size limit from default 2MB
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.quran\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'quran-api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            // Note: Hadith (cdn.jsdelivr.net) is intentionally NOT cached here.
            // Hadith is online-only; offline will show a "requires internet" message.
          ]
        }
      })
    ],
  }
})
