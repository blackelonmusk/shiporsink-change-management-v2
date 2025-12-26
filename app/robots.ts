import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/project/'],
      },
    ],
    sitemap: 'https://change.shiporsink.ai/sitemap.xml',
  }
}
