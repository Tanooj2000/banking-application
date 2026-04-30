import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Note: Backend APIs are hardcoded as http://localhost:808x in api/ files
    // Ensure all 6 backend services (8081-8086) are running locally
  }
});