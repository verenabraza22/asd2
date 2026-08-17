import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Entre Páginas · Diario de Lectura',
    short_name: 'Entre Páginas',
    description:
      'Registra, planifica y analiza tus hábitos de lectura en un rincón cálido y acogedor.',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf6f0',
    theme_color: '#6f4e37',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
