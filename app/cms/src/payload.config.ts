import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { cmsRoot } from './path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import dotenv from 'dotenv'


const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const mediaDir = path.resolve(cmsRoot, 'media');

dotenv.config({
  path: path.resolve(dirname, '../../../.env')  // Now resolves to project root
});

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    // Moves payload-types.ts to /app/cms/payload-types.ts
    outputFile: path.resolve(cmsRoot, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || `file:${path.resolve(cmsRoot, 'local.db')}`,
    },
  }),
  sharp,
  plugins: [],
})