export type Endpoint = {
  method: string
  path: string
  description: string
}

export type ServiceInfo = {
  name: string
  version: string
  endpoints: Endpoint[]
}

// À compléter à chaque nouvelle route : cette liste sert de documentation d'entrée de l'API.
const endpoints: Endpoint[] = [
  { method: 'GET', path: '/', description: "Présente l'API : nom, version et liste des endpoints" },
  { method: 'GET', path: '/health', description: 'État du process : status, uptime et timestamp' },
]

export function getServiceInfo(name: string, version: string): ServiceInfo {
  return { name, version, endpoints }
}
