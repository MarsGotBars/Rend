import { spawn } from 'child_process'
import { NextResponse } from 'next/server'
import path from 'path'
import { fileURLToPath } from 'url'

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../..')

// In-memory state — persists for the lifetime of the Next.js server process.
// Prevents concurrent builds if the button is clicked multiple times.
let isRebuilding = false

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
			// Don't set PAYLOAD_CONFIG_PATH in container — let entries() gracefully handle missing config
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
			console.log('[rebuild] SvelteKit rebuild complete. NOTE: Server must be restarted for changes to take effect.')
		} else {
			console.error(`[rebuild] SvelteKit rebuild failed (exit ${code}).`)
		}
	})

	return NextResponse.json({ status: 'started', note: 'Server must be restarted after rebuild for changes to take effect' })
}

export async function GET() {
	return NextResponse.json({ isRebuilding })
}
