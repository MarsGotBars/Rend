import { createServer } from 'node:http';
import { handler as skHandler } from './build/handler.js';
import next from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

try {
	console.log('Starting server...');
	console.log('__dirname:', __dirname);
	
	const nextAppDir = path.resolve(__dirname, 'app/cms');
	console.log('Next.js app directory:', nextAppDir);
	
	const nextApp = next({
		dev: false,
		dir: nextAppDir
	});

	console.log('Preparing Next.js app...');
	const nextHandler = nextApp.getRequestHandler();
	await nextApp.prepare();
	console.log('✓ Next.js app prepared');

	const server = createServer((req, res) => {
		const url = req.url ?? '/';

		if (url.startsWith('/admin') || url.startsWith('/_next') || url.startsWith('/api')) {
			nextHandler(req, res);
		} else {
			skHandler(req, res);
		}
	});

	server.listen(PORT, () => {
		console.log(`✓ Server running on http://0.0.0.0:${PORT}`);
	});

	server.on('error', (err) => {
		console.error('✗ Server error:', err);
	});
} catch (err) {
	console.error('✗ Failed to start server:', err);
	process.exit(1);
}
