import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'

// Tests get a new database and media folder. They never touch the developer's data.
const directory = mkdtempSync(path.join(tmpdir(), 'common-cms-test-'))
try {
  const child = spawnSync(
    process.execPath,
    ['node_modules/payload/bin.js', 'run', 'tests/integration.ts'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        DATABASE_URL: `file:${path.join(directory, 'test.db')}`,
        MEDIA_DIR: path.join(directory, 'media'),
        PAYLOAD_SECRET: randomBytes(32).toString('hex'),
        CMS_INTEGRATION_TEST: 'true',
      },
    },
  )
  process.exitCode = child.status ?? 1
} finally {
  rmSync(directory, { recursive: true, force: true })
}
