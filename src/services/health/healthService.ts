export type ProcessHealth = {
  status: 'ok'
  uptime: number
  timestamp: string
}

// Ne regarde que le process : l'état de la base de données relève de /db-health.
export function getProcessHealth(): ProcessHealth {
  return {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }
}
