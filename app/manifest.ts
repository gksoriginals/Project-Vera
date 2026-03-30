import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vera',
    short_name: 'Vera',
    description: 'Accessibility-first live captioning and communication platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf8f5',
    theme_color: '#b45309',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
