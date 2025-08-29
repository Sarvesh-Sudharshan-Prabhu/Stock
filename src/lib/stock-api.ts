// IMPORTANT: This file should not be used on the client side.
'use server';

import { z } from 'zod';
import { type StockData, type TimeRange } from './types';
import { analyzeStockSentiment } from '@/ai/flows/analyze-stock-sentiment';

const API_KEY = process.env.POLYGON_API_KEY;

if (!API_KEY) {
  throw new Error('Polygon.io API key is not set.');
}

const NewsArticleSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});
export type NewsArticle = z.infer<typeof NewsArticleSchema>;

const StockDetailsSchema = z.object({
  name: z.string(),
});

interface PolygonAggregatesResponse {
  results: { t: number; o: number }[];
  ticker: string;
}

interface PolygonSnapshotResponse {
  ticker: {
    day: { c: number; o: number };
    todaysChange: number;
    todaysChangePerc: number;
  };
}

export async function getStockData(
  ticker: string,
  range: TimeRange
): Promise<StockData | null> {
  try {
    const [details, snapshot, aggregates, sentiment] = await Promise.all([
      getStockDetails(ticker),
      getTickerSnapshot(ticker),
      getAggregateData(ticker, range),
      analyzeStockSentiment({ ticker }),
    ]);

    if (!details || !snapshot || !aggregates) {
      console.error(`Failed to fetch complete data for ${ticker}`);
      return null;
    }

    const { name } = details;
    const { price, change, changePercent } = snapshot;

    return {
      ticker,
      name,
      price,
      change,
      changePercent,
      chartData: aggregates.map((agg) => ({
        date: new Date(agg.t).toISOString(),
        value: agg.o,
      })),
      sentiment,
    };
  } catch (error) {
    console.error(`Error fetching stock data for ${ticker}:`, error);
    return null;
  }
}

async function getStockDetails(ticker: string) {
  const url = `https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch stock details: ${response.statusText}`
      );
    }
    const data = await response.json();
    return StockDetailsSchema.parse(data.results);
  } catch (error) {
    console.error(`Error in getStockDetails for ${ticker}:`, error);
    return { name: 'Unknown Company' }; // Fallback
  }
}

async function getTickerSnapshot(ticker: string) {
  const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}?apiKey=${API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data: PolygonSnapshotResponse = await response.json();

    return {
      price: data.ticker.day.c,
      change: data.ticker.todaysChange,
      changePercent: data.ticker.todaysChangePerc,
    };
  } catch (error) {
    console.error(`Error fetching ticker snapshot for ${ticker}:`, error);
    // Return a default/fallback structure on error
    return { price: 0, change: 0, changePercent: 0 };
  }
}

function getAggregateDateRange(range: TimeRange) {
  const today = new Date();
  let fromDate: Date;
  let timespan: string;
  let multiplier: number;

  switch (range) {
    case '1D':
      fromDate = new Date();
      fromDate.setDate(today.getDate() - 1);
      timespan = 'minute';
      multiplier = 5;
      break;
    case '1W':
      fromDate = new Date();
      fromDate.setDate(today.getDate() - 7);
      timespan = 'hour';
      multiplier = 1;
      break;
    case '1M':
    default:
      fromDate = new Date();
      fromDate.setMonth(today.getMonth() - 1);
      timespan = 'day';
      multiplier = 1;
  }

  const to = today.toISOString().split('T')[0];
  const from = fromDate.toISOString().split('T')[0];
  return { from, to, multiplier, timespan };
}

async function getAggregateData(ticker: string, range: TimeRange) {
  const { from, to, multiplier, timespan } = getAggregateDateRange(range);
  const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&apiKey=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data: PolygonAggregatesResponse = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`Error fetching aggregate data for ${ticker}:`, error);
    return []; // Return empty array on error
  }
}

export async function getNews(ticker: string): Promise<NewsArticle[]> {
  const url = `https://api.polygon.io/v2/reference/news?ticker=${ticker}&limit=10&apiKey=${API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.statusText}`);
    }
    const data = await response.json();
    return z.array(NewsArticleSchema).parse(data.results);
  } catch (error) {
    console.error(`Error fetching news for ${ticker}:`, error);
    return [];
  }
}
