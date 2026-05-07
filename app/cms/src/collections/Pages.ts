import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL path segment, e.g. "about" → /about',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'thumbImage',
      type: 'relationship',
      relationTo: 'images',
      hasMany: false,
    },
    {
      name: 'images',
      type: 'relationship',
      relationTo: 'images',
      hasMany: true,
    },
  ],
}
