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
        // Fixed endpoint — mirrors api/matches.js Vercel function
        '/api/matches': {
          target: 'https://api.football-data.org/v4',
          changeOrigin: true,
          rewrite: () => '/competitions/WC/matches',
          headers: { 'X-Auth-Token': env.VITE_FOOTBALL_API_KEY || '' },
        },
        // Fixed endpoint — mirrors api/odds.js Vercel function
        '/api/odds': {
          target: 'https://api.the-odds-api.com/v4',
          changeOrigin: true,
          rewrite: () => '/sports/soccer_fifa_world_cup/odds',
        },
      },
    },
  }
})
