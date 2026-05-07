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
    const migrationsPath = path.resolve(__dirname, 'app/cms/migrations')
    if (!existsSync(migrationsPath)) {
      console.log('\n▶ No migrations found, generating initial migration...')
      try {
        await runCommand('pnpm', ['payload', 'migrate:create', '--name', 'initial'], {
          cwd: path.resolve(__dirname, 'app/cms'),
          env: { ...process.env, PAYLOAD_CONFIG_PATH: './src/payload.config.ts', NODE_OPTIONS: '--no-deprecation' }
        })
      } catch (err) {
        console.warn('\n⚠ Could not generate initial migration (will run at startup):', err.message)
      }
    }

    // Try to run migrations but don't fail build if they fail
    try {
      await runCommand('pnpm', ['run', 'build:migrate'])
      console.log('✓ Migrations completed')
    } catch (err) {
      console.warn('\n⚠ Migrations failed (will retry at startup):', err.message)
    }

    await runCommand('pnpm', ['run', 'build:next'])
    
    // Pass PAYLOAD_CONFIG_PATH to SvelteKit build so it can resolve Payload config during prerender
    // Use relative path so it works in both local and container environments
    await runCommand('pnpm', ['run', 'build:sveltekit'], {
      env: { 
        ...process.env, 
        PAYLOAD_CONFIG_PATH: './app/cms/src/payload.config.ts',
        NODE_OPTIONS: '--no-deprecation'
      }
    })

    console.log('\n✓ Build complete')
  } catch (err) {
    console.error('\n✗ Build failed:', err.message)
    process.exit(1)
  }
}

build()