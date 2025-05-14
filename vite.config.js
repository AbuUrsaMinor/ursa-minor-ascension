import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
// https://vitejs.dev/config/
export default defineConfig({
    base: '/ursa-minor-ascension/',
    plugins: [
        react({
            jsxRuntime: 'automatic',
            babel: {
                plugins: [
                // Add any babel plugins you need here
                ],
            },
        }),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            includeAssets: ['vite.svg'],
            devOptions: {
                enabled: true, // Corrected: To enable SW in dev, set enabled to true
            },
            manifest: {
                name: 'Ursa Minor Ascension',
                short_name: 'Ascension',
                description: 'Turn textbook pages into quizzes and flashcards',
                theme_color: '#000000',
                background_color: '#ffffff',
                display: 'standalone',
                scope: '/ursa-minor-ascension/',
                start_url: '/ursa-minor-ascension/',
                icons: [
                    {
                        src: 'vite.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    },
                    {
                        src: 'vite.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/.*\.azure\.com/,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'azure-api-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 // 24 hours
                            }
                        }
                    }
                ]
            }
        })
    ]
});
