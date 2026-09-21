import type { Request, Response } from 'express'
import { serviceName, serviceVersion } from '@/config/service.js'
import { getServiceInfo } from '@/services/root/rootService.js'

export function getRoot(_req: Request, res: Response) {
  res.json(getServiceInfo(serviceName, serviceVersion))
}
