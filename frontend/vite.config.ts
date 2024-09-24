// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react-swc'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })


import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {  
        name: "AmirChat App",
        short_name: "AmirChat",
        description: "A chat app made with 💖 by amirreza abdolrahimi with PWA features",
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icons/icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
      }
    })
  ]
});
