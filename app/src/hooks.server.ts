import { getPayload } from 'payload';
import type { Payload } from 'payload';
import config from '../cms/src/payload.config'
import type { Handle } from '@sveltejs/kit';

// Declare the Locals type
declare global {
  namespace App {
    interface Locals {
      payload: Payload;
    }
  }
}

let payload: Payload | null = null;

async function initPayload() {
  if (!payload) {
    payload = await getPayload({ config });
  }
  return payload;
}

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.payload = await initPayload();
  
  const response = await resolve(event);
  return response;
};