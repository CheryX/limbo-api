import express from 'express'
import env from 'dotenv'
import query, { init_db } from './lib/db'
import { getFiles } from './lib/r2'
const app = express()
const port = 3000

env.config();

app.get('/', (req, res) => {
  res.status(200).json({
    status: "The void appears to be working..."
  })
})

app.get('/files', async (req, res) => {
  const data = await query("SELECT * FROM files WHERE size < $1;", ["10000"]);
  res.json(data);
})

app.get('/files2', async (req, res) => {
  const data = await getFiles();
  res.json(data)
})

app.listen(port, () => {
  console.log(`The void appears on http://localhost:${port}`)

  init_db();
})