import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import dotenv from 'dotenv'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { Users } from './collections/Users'
import { Pages } from './collections/Pages'
import { Images } from './collections/Images'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// 1. Load .env from the project root reliably
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
})

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Pages, Images],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    // Keeps types in the CMS source folder for development convenience
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      // 2. Database now lives in the project root
      url: process.env.DATABASE_URL || `file:${path.resolve(process.cwd(), 'dev.db')}`,
    },
  }),
  sharp,
  plugins: [],
})