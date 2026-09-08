import 'dotenv/config';
import express from 'express';
import { uploadTriggerRouter } from './routes/uploadTrigger';

const app = express();
app.use(express.json());

app.use('/api', uploadTriggerRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
