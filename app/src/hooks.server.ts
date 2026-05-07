import { getPayload } from 'payload'
import type { Payload } from 'payload'
import type { Handle } from '@sveltejs/kit'

declare global {
	namespace App {
		interface Locals {
			payload: Payload
		}
	}
}

let payload: Payload | null = null

async function initPayload() {
	if (!payload) {
		// Dynamic import to resolve path at runtime, not build time
		const { default: config } = await import('../cms/src/payload.config.ts')
		payload = await getPayload({ config })
	}
	return payload
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.payload = await initPayload()
	const response = await resolve(event)
	return response
}