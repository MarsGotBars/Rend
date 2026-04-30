import { createServer } from 'node:http';
import { handler as skHandler } from './build/handler.js';
import next from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const nextApp = next({
	dev: false,
	dir: path.resolve(__dirname, 'app/cms')
});

const nextHandler = nextApp.getRequestHandler();
await nextApp.prepare();

createServer((req, res) => {
	const url = req.url ?? '/';

	if (url.startsWith('/admin') || url.startsWith('/_next') || url.startsWith('/api')) {
		nextHandler(req, res);
	} else {
		skHandler(req, res);
	}
    
}).listen(PORT, () => {
	console.log(`Running on http://localhost:${PORT}`);
});
