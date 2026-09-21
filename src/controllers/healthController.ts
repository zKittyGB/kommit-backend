import type { Request, Response } from 'express'
import { getProcessHealth } from '@/services/health/healthService.js'

export function getHealth(_req: Request, res: Response) {
  res.json(getProcessHealth())
}
