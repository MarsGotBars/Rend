import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import { existsSync, writeFileSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(__dirname, '.env') })

async function runCommand(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶ ${cmd} ${args.join(' ')}`)
    const spawnOptions = {
      stdio: 'inherit',
      shell: true,
      ...options,
      env: options.env ? { ...process.env, ...options.env } : process.env
    }
    const proc = spawn(cmd, args, spawnOptions)
    proc.on('close', code => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} failed with code ${code}`))
    })
  })
}

async function build() {
  if(process.env.MIGRATIONS === 'false') {
    console.log("Build is currently disabled as migrations interfere with development");
    
    return
  }
  try {
    // Create empty DB file if it doesn't exist
    const dbPath = path.resolve(__dirname, 'dev.db')
    if (!existsSync(dbPath)) {
      console.log('\n▶ No database found, creating dev.db...')
      writeFileSync(dbPath, '')
    }

    // Generate initial migration if none exist
    const migrationsPath = path.resolve(__dirname, 'migrations')
    if (!existsSync(migrationsPath)) {
      console.log('\n▶ No migrations found, generating initial migration...')
      await runCommand('pnpm', ['payload', 'migrate:create', '--name', 'initial'], {
        cwd: path.resolve(__dirname, 'app/cms'),
        env: { ...process.env, PAYLOAD_CONFIG_PATH: './src/payload.config.ts', NODE_OPTIONS: '--no-deprecation' }
      })
    }

    await runCommand('pnpm', ['run', 'build:migrate'])
    await runCommand('pnpm', ['run', 'build:next'])
    await runCommand('pnpm', ['run', 'build:sveltekit'])

    console.log('\n✓ Build complete')
  } catch (err) {
    console.error('\n✗ Build failed:', err.message)
    process.exit(1)
  }
}

build()