import path from 'path';
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const cmsRoot = path.resolve(dirname); 
export const mediaDir = path.resolve(cmsRoot, 'media');