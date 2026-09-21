import { readFileSync } from 'node:fs'

// Même profondeur depuis src/config/ et dist/config/ : le chemin marche en dev comme après le build.
const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { name: string; version: string }

export const serviceName = packageJson.name
export const serviceVersion = packageJson.version
