import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '.env') })

async function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶ ${cmd} ${args.join(' ')}`)
    const proc = spawn(cmd, args, { stdio: 'inherit' })
    proc.on('close', code => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} failed with code ${code}`))
    })
  })
}

async function build() {
  try {
    await runCommand('pnpm', ['run', 'build:migrate'])
    
    await runCommand('pnpm', ['run', 'build:sveltekit'])
    
    console.log('\n✓ Build complete')
  } catch (err) {
    console.error('\n✗ Build failed:', err.message)
    process.exit(1)
  }
}

build()