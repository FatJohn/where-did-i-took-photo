import { createHash, randomBytes } from 'node:crypto'

export function generateVisitorToken() {
  return randomBytes(24).toString('hex')
}

export function hashVisitorToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
