import express from 'express'
import { corsMiddleware } from '@/middlewares/cors.js'
import { routes } from '@/routes/index.js'

export const app = express()

app.use(corsMiddleware)
app.use(routes)
