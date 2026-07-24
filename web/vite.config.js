import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base يطابق اسم مستودع GitHub Pages: https://<user>.github.io/Permits-PTW-SFT/
export default defineConfig({
  plugins: [react()],
  base: '/Permits-PTW-SFT/'
});
