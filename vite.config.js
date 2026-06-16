import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // loadEnv reads .env, .env.local, etc. — makes VITE_* vars available to the proxy
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api/football': {
          target: 'https://api.football-data.org/v4',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/football/, ''),
          headers: {
            'X-Auth-Token': env.VITE_FOOTBALL_API_KEY || '',
          },
        },
        '/api/odds': {
          target: 'https://api.the-odds-api.com/v4',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/odds/, ''),
        },
      },
    },
  }
})
