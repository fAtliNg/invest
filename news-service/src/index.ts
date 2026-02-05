import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { updateNewsCache, getNews, getSources } from './aggregator';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Get news
app.get('/news', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const source = req.query.source as string;
  
  const news = getNews(limit, source);
  res.json({
    data: news,
    sources: getSources()
  });
});

// Start server and cron
app.listen(PORT, async () => {
  console.log(`News Service running on port ${PORT}`);
  
  // Initial fetch
  await updateNewsCache();
  
  // Schedule updates every 10 minutes
  cron.schedule('*/10 * * * *', () => {
    updateNewsCache();
  });
});
