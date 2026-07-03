import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MangoDB Premium Harvest',
    short_name: 'MangoDB',
    description: 'Fresh, organic Rajshahi mangoes delivered directly from farm to doorstep.',
    start_url: '/',
    display: 'standalone',
    background_color: '#05070f',
    theme_color: '#fbbf24',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      }
      // Note: For a full PWA, you should add a 192x192 and 512x512 icon in the public folder
    ],
  }
}
