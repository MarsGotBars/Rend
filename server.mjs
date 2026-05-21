import { createServer } from 'node:http';
import next from 'next';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const PORT = process.env.PORT || 3000;

// Global state for hot reload
let skHandler = null;
let skModule = null;
let nextHandler = null;
let nextPrepared = false;

// Function to load SvelteKit handler (can be called to reload)
async function loadSvelteKitHandler() {
	try {
		// Clear the require cache and re-import to get fresh handler
		// For ESM, we need to use a query param trick to bypass cache
		const timestamp = Date.now();
		const modulePath = `./build/handler.js?t=${timestamp}`;
		
		// Try to unload the old module from Node's cache
		delete import.meta.url;
		
		skModule = await import('./build/handler.js?' + timestamp);
		skHandler = skModule.handler;
		console.log('✓ SvelteKit handler reloaded');
		return true;
	} catch (err) {
		console.error('✗ Failed to reload SvelteKit handler:', err.message);
		return false;
	}
}

// EventEmitter-style reload trigger
let reloadListeners = [];
export function onReload(callback) {
	reloadListeners.push(callback);
}

export async function triggerReload() {
	console.log('[reload] Triggering hot reload...');
	const success = await loadSvelteKitHandler();
	if (success) {
		console.log('[reload] SvelteKit handler reloaded successfully');
		reloadListeners.forEach(cb => cb());
	}
	return success;
}

async function start() {
	try {
		console.log('Starting server...');
		console.log('__dirname:', __dirname);
		
		// Initialize Payload (triggers schema push via adapter config)
		try {
			const configPath = process.env.PAYLOAD_CONFIG_PATH || path.resolve(__dirname, 'app/cms/src/payload.config.ts');
			const configUrl = pathToFileURL(configPath).href;
			const { getPayload } = await import('payload');
			const configModule = await import(configUrl);
			await getPayload({ config: configModule.default });
			console.log('✓ Payload initialized (schema auto-pushed)');
		} catch (err) {
			console.warn('⚠ Payload init:', err.message);
		}
		
		const nextAppDir = path.resolve(__dirname, 'app/cms');
		console.log('Next.js app directory:', nextAppDir);
		
		// Load initial SvelteKit handler
		await loadSvelteKitHandler();
		
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

			// Handle internal reload endpoint
			if (url === '/__reload' && req.method === 'POST') {
				loadSvelteKitHandler().then((success) => {
					if (success) {
						res.writeHead(200, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify({ status: 'reloaded' }));
					} else {
						res.writeHead(500, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify({ status: 'failed' }));
					}
				});
				return;
			}

			if (url === '/__health') {
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('ok');
				return;
			}

			if (nextPrepared && (url.startsWith('/admin') || url.startsWith('/_next') || url.startsWith('/api'))) {
				nextHandler(req, res);
			} else if (skHandler) {
				skHandler(req, res);
			} else {
				res.writeHead(503, { 'Content-Type': 'text/plain' });
				res.end('Service Unavailable: SvelteKit handler not ready');
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
