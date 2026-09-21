function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`)
  return value
}

export const port = Number(process.env.PORT ?? 3000)
export const databaseUrl = requireEnv('DATABASE_URL')
