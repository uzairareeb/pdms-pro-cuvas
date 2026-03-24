
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'recharts', 'lucide-react'],
          'supabase': ['@supabase/supabase-js'],
          'utils': ['jspdf', 'jspdf-autotable', 'papaparse', 'dayjs']
        }
      }
    }
  }
});
