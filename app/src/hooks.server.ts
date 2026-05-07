import { getPayload } from 'payload'
import type { Payload } from 'payload'
import type { Handle } from '@sveltejs/kit'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

declare global {
	namespace App {
		interface Locals {
			payload: Payload | any
		}
	}
}

let payload: Payload | null = null

async function initPayload() {
	if (!payload) {
		try {
			// Use PAYLOAD_CONFIG_PATH env var if set (for build time)
			// Otherwise, use runtime path resolution
			let configModule

			if (process.env.PAYLOAD_CONFIG_PATH) {
				// Convert to file:// URL for Windows compatibility
				const configPath = process.env.PAYLOAD_CONFIG_PATH
				const urlPath = configPath.startsWith('file://') ? configPath : pathToFileURL(configPath).href
				configModule = await import(urlPath)
			} else {
				// Use relative path for runtime
				configModule = await import('../cms/src/payload.config.ts')
			}

			const config = configModule.default
			payload = await getPayload({ config })
		} catch (err) {
			console.warn('Failed to initialize Payload:', err instanceof Error ? err.message : String(err))
			console.warn('Using fallback Payload - this is expected during prerender')
			// Return a fallback object that returns empty results
			// This allows prerender to complete even if Payload can't initialize
			payload = createFallbackPayload()
		}
	}
	return payload
}

function createFallbackPayload(): any {
	return {
		find: async () => ({ docs: [] }),
		create: async () => ({}),
		update: async () => ({}),
		delete: async () => ({}),
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.payload = await initPayload()
	const response = await resolve(event)
	return response
}