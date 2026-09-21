import cors from 'cors'

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
]

export const corsMiddleware = cors({ origin: allowedOrigins })
