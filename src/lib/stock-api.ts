'use server';

import { z } from 'zod';
import { type StockData, type TimeRange, TickerSearchResultSchema, type NewsArticle, type TickerSearchResult } from './types';

const API_KEY = process.env.POLYGON_API_KEY;

if (!API_KEY) {
  throw new Error('Polygon.io API key is not set.');
}

const StockDetailsSchema = z.object({
  name: z.string(),
  branding: z.object({
    logo_url: z.string().optional(),
  }).optional(),
});

interface PolygonAggregatesResponse {
  results: { t: number; c: number }[];
  ticker: string;
}

export async function searchTickers(query: string): Promise<TickerSearchResult> {
  if (!query) {
    return [];
  }
  const url = `https://api.polygon.io/v3/reference/tickers?search=${query}&active=true&limit=10&apiKey=${API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch tickers: ${response.statusText}`);
    }
    const data = await response.json();
    return TickerSearchResultSchema.parse(data.results);

  } catch (error) {
    console.error(`Error searching for tickers:`, error);
    return [];
  }
}

export async function getStockData(
  ticker: string,
  range: TimeRange,
): Promise<Omit<StockData, 'sentiment'> | null> {
  try {
    const [details, aggregates] = await Promise.all([
      getStockDetails(ticker),
      getAggregateData(ticker, range),
    ]);

    if (!details || !aggregates || aggregates.length === 0) {
      console.error(`Failed to fetch complete data for ${ticker}`);
      return null;
    }
    
    const { name } = details;
    const currentPrice = aggregates[aggregates.length - 1].c;
    // Calculate change based on the first and last points in the aggregate data
    const openingPrice = aggregates[0].c;
    const change = currentPrice - openingPrice;
    const changePercent = openingPrice !== 0 ? (change / openingPrice) * 100 : 0;

    return {
      ticker,
      name,
      price: currentPrice,
      change,
      changePercent,
      chartData: aggregates.map((agg) => ({
        date: new Date(agg.t).toISOString(),
        value: agg.c,
      })),
      logoUrl: details.branding?.logo_url ? `${details.branding.logo_url}?apiKey=${API_KEY}`: undefined,
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

function getAggregateDateRange(range: TimeRange) {
  const today = new Date();
  let fromDate: Date;
  let timespan: string;
  let multiplier: number;

  switch (range) {
    case '1D':
      fromDate = new Date();
      // Go back one day. If it's a weekend, it will be handled by the API returning the last trading day's data.
      // To be safe, we can go back a few days to ensure we land on a trading day.
      fromDate.setDate(today.getDate() - 3);
      timespan = 'minute';
      multiplier = 5;
      break;
    case '1W':
      fromDate = new Date();
      fromDate.setDate(today.getDate() - 7);
      timespan = 'hour';
      multiplier = 1;
      break;
    case '6M':
      fromDate = new Date();
      fromDate.setMonth(today.getMonth() - 6);
      timespan = 'day';
      multiplier = 1;
      break;
    case '1Y':
      fromDate = new Date();
      fromDate.setFullYear(today.getFullYear() - 1);
      timespan = 'day';
      multiplier = 1;
      break;
    case 'All':
      fromDate = new Date();
      fromDate.setFullYear(today.getFullYear() - 20); // Fetch up to 20 years of data
      timespan = 'month';
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
  const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=5000&apiKey=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data: PolygonAggregatesResponse = await response.json();
    
    // For 1D, we might get more than one day's data, so we filter to the most recent day
    if (range === '1D' && data.results && data.results.length > 0) {
        const lastTimestamp = data.results[data.results.length - 1].t;
        const lastDate = new Date(lastTimestamp).toDateString();
        return data.results.filter(r => new Date(r.t).toDateString() === lastDate);
    }
    
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
    const NewsArticleSchema = z.object({
      title: z.string(),
      description: z.string().optional(),
    });
    return z.array(NewsArticleSchema).parse(data.results);
  } catch (error) {
    console.error(`Error fetching news for ${ticker}:`, error);
    return [];
  }
}
