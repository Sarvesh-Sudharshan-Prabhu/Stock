import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-stock-sentiment.ts';
import '@/ai/flows/summarize-market-sentiment.ts';
import '@/ai/flows/predict-stock-price.ts';
