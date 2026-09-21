import { app } from '@/app.js'
import { port } from '@/config/env.js'

app.listen(port, () => {
  console.log(`kommit-backend écoute sur le port ${port}`)
})
