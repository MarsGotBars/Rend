import { spawn } from 'child_process'
import { NextResponse } from 'next/server'
import path from 'path'
import { fileURLToPath } from 'url'
import http from 'http'

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../..')

// In-memory state — persists for the lifetime of the Next.js server process.
// Prevents concurrent builds if the button is clicked multiple times.
let isRebuilding = false

// Trigger hot reload on parent server via internal HTTP call
async function triggerHotReload() {
	return new Promise((resolve, reject) => {
		const req = http.request(
			{
				hostname: 'localhost',
				port: process.env.PORT || 3000,
				path: '/__reload',
				method: 'POST',
				timeout: 5000,
			},
			(res) => {
				let data = ''
				res.on('data', (chunk) => {
					data += chunk
				})
				res.on('end', () => {
					if (res.statusCode === 200) {
						resolve(true)
					} else {
						reject(new Error(`Reload request failed with status ${res.statusCode}`))
					}
				})
			}
		)

		req.on('error', reject)
		req.on('timeout', () => {
			req.destroy()
			reject(new Error('Reload request timeout'))
		})
		req.end()
	})
}

export async function POST() {
	if (isRebuilding) {
		return NextResponse.json({ status: 'already_building' }, { status: 409 })
	}

	isRebuilding = true

	// Clean old build to avoid stale chunk references
	const fsPromises = await import('fs/promises')
	try {
		await fsPromises.rm(path.join(workspaceRoot, '.svelte-kit/output'), { recursive: true, force: true })
	} catch {
		// Ignore cleanup errors
	}

	const proc = spawn('pnpm', ['run', 'build:sveltekit'], {
		cwd: workspaceRoot,
		shell: true,
		stdio: 'pipe',
		env: {
			...process.env,
			PAYLOAD_CONFIG_PATH: path.resolve(workspaceRoot, 'app/cms/src/payload.config.ts'),
			NODE_OPTIONS: '--no-deprecation'
		}
	})

	const output: string[] = []

	proc.stdout?.on('data', (chunk: Buffer) => {
		const line = chunk.toString()
		output.push(line)
		process.stdout.write(`[rebuild] ${line}`)
	})

	proc.stderr?.on('data', (chunk: Buffer) => {
		const line = chunk.toString()
		output.push(line)
		process.stderr.write(`[rebuild] ${line}`)
	})

	// Respond immediately — the build runs in the background.
	// The client can poll /api/rebuild (GET) to check status.
	proc.on('close', (code) => {
		isRebuilding = false
		if (code === 0) {
			console.log('[rebuild] SvelteKit rebuild complete. Triggering hot reload...')
			// Trigger hot reload on the parent server
			triggerHotReload().catch(err => {
				console.error('[rebuild] Failed to trigger hot reload:', err.message)
			})
		} else {
			console.error(`[rebuild] SvelteKit rebuild failed (exit ${code}).`)
		}
	})

	return NextResponse.json({ status: 'started' })
}

export async function GET() {
	return NextResponse.json({ isRebuilding })
}
