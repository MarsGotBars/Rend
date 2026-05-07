// collections/Media.ts
import path from 'path'
import type { CollectionConfig } from 'payload'
import fs from 'fs/promises'

const staticDir = path.resolve(process.cwd(), 'media')
export const Images: CollectionConfig = {
  slug: 'images',
  upload: {
    adminThumbnail: 'thumbnail',
    staticDir,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 800,
        height: undefined,
        formatOptions: {
          format: 'webp',
          options: { quality: 80 },
        },
        generateImageName: ({ originalName, sizeName, extension }) =>
          `thumbnail/${originalName.replace(/\.[^.]+$/, '')}-${sizeName}.${extension}`,
      },
    ],
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeOperation: [
      async ({ operation }) => {
        if (operation !== 'create') return
        await fs.mkdir(path.resolve(staticDir, 'thumbnail'), { recursive: true })
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
