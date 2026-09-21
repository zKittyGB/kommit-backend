export interface DbHealthRepository {
  ping(): Promise<void>
}

export type DbHealth =
  | { status: 'ok'; latencyMs: number }
  | { status: 'unreachable' }

export async function getDbHealth(repository: DbHealthRepository): Promise<DbHealth> {
  const start = performance.now()

  try {
    await repository.ping()
  } catch (error) {
    console.error('Base de données injoignable :', error)
    return { status: 'unreachable' }
  }

  return { status: 'ok', latencyMs: Math.round(performance.now() - start) }
}
