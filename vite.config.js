import { defineConfig } from 'vite';
export default defineConfig({
  base:'./',
  optimizeDeps:{exclude:['onnxruntime-web']},
  build:{
    target:'es2022',
    rollupOptions:{external:['onnxruntime-web']}
  },
  server:{headers:{
    'Cross-Origin-Opener-Policy':'same-origin',
    'Cross-Origin-Embedder-Policy':'require-corp'
  }}
});
