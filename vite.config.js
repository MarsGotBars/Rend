import { sveltekit } from '@sveltejs/kit/vite';
import dotenv from 'dotenv';
import { defineConfig } from 'vite';

dotenv.config({ path: '.env' });

export default defineConfig({
	plugins: [sveltekit()]
});
