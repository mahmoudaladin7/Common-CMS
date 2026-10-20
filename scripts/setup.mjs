import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

if (existsSync('.env')) {
  console.log('.env already exists; preserved without changes.')
} else {
  const template = readFileSync('.env.example', 'utf8')
  writeFileSync(
    '.env',
    template.replace('PAYLOAD_SECRET=', `PAYLOAD_SECRET=${randomBytes(32).toString('hex')}`),
    { mode: 0o600 },
  )
  console.log('Created .env with a unique secret. Next: npm run dev, then open /admin.')
}
