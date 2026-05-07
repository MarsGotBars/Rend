import { createServer } from 'node:http';
import { handler as skHandler } from './build/handler.js';
import next from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPayload } from 'payload';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

async function initializeDatabase() {
	try {
		console.log('Initializing database...');
		
		// Import the compiled Payload config from Next.js build
		const { default: config } = await import('./app/cms/.next/server/chunks/payload.config.js');
		
		console.log('Loading Payload...');
		const payload = await getPayload({ config });
		
		console.log('✓ Database initialized');
		return payload;
	} catch (err) {
		console.warn('⚠ Database initialization warning:', err.message);
		return null;
	}
}

async function start() {
	try {
		console.log('Starting server...');
		console.log('__dirname:', __dirname);
		
		// Initialize database
		await initializeDatabase();
		
		const nextAppDir = path.resolve(__dirname, 'app/cms');
		console.log('Next.js app directory:', nextAppDir);
		
		let nextHandler = null;
		let nextPrepared = false;
		
		try {
			const nextApp = next({
				dev: false,
				dir: nextAppDir
			});

			console.log('Preparing Next.js app...');
			nextHandler = nextApp.getRequestHandler();
			await nextApp.prepare();
			nextPrepared = true;
			console.log('✓ Next.js app prepared');
		} catch (nextErr) {
			console.warn('⚠ Next.js app preparation failed, will serve SvelteKit only:', nextErr.message);
		}

		const server = createServer((req, res) => {
			const url = req.url ?? '/';

			if (nextPrepared && (url.startsWith('/admin') || url.startsWith('/_next') || url.startsWith('/api'))) {
				nextHandler(req, res);
			} else {
				skHandler(req, res);
			}
		});

		server.listen(PORT, '0.0.0.0', () => {
			console.log(`✓ Server running on http://0.0.0.0:${PORT}`);
		});

		server.on('error', (err) => {
			console.error('✗ Server error:', err);
		});
	} catch (err) {
		console.error('✗ Failed to start server:', err);
		process.exit(1);
	}
}

start();
