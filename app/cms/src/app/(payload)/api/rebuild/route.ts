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

	const proc = spawn('pnpm', ['run', 'build:sveltekit'], {
		cwd: workspaceRoot,
		shell: true,
		stdio: 'pipe',
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
			console.log('[rebuild] SvelteKit rebuild complete.')
		} else {
			console.error(`[rebuild] SvelteKit rebuild failed (exit ${code}).`)
		}
	})

	return NextResponse.json({ status: 'started' })
}

export async function GET() {
	return NextResponse.json({ isRebuilding })
}
