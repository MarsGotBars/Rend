// collections/Media.ts
import path from 'path'
import { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    // 3. Media files are saved to /media in the project root
    staticDir: path.resolve(process.cwd(), 'media'),
    staticURL: '/media', 
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}