import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => res.json({ ok: true }))

app.use('/auth', authRouter)

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  const status = err.status ?? 500
  res.status(status).json({ message: err.message ?? 'Internal server error' })
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Express API listening on :${port}`))
