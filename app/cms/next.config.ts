import { withPayload } from '@payloadcms/next/withPayload'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

dotenv.config({
  path: path.resolve(__dirname, '.env'),
})

// /** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(dirname, '../../'),
  },
}

export default withPayload(nextConfig)
