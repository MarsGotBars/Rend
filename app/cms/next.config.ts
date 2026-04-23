import { withPayload } from '@payloadcms/next/withPayload'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
console.log(dirname);

// /** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(dirname, '../../'),
  },
  experimental: {
    turbopackServerFastRefresh: true,
  }
}

export default withPayload(nextConfig)