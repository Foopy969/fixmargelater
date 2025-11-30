import express from 'express'
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express()
const port = Number.parseInt(process.env.PORT ?? '5000', 10);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.post('/translate', (req, res) => {
  res.json({ translatedText: 'Hello World!' });
  return
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
