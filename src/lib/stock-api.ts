
'use server';

import { z } from 'zod';
import { type StockData, type TimeRange, TickerSearchResultSchema, type NewsArticle, type TickerSearchResult, SentimentDataSchema } from './types';

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
  results: { t: number; o: number }[];
  ticker: string;
}

interface PolygonPreviousCloseResponse {
  results: {
    c: number; // close
    o: number; // open
  }[];
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
    const [details, aggregates, prevDayClose] = await Promise.all([
      getStockDetails(ticker),
      getAggregateData(ticker, range),
      getPreviousDayClose(ticker)
    ]);

    if (!details || !aggregates || !prevDayClose || aggregates.length === 0) {
      console.error(`Failed to fetch complete data for ${ticker}`);
      return null;
    }

    const { name } = details;
    const currentPrice = aggregates[aggregates.length - 1].o;
    const change = currentPrice - prevDayClose.c;
    const changePercent = (change / prevDayClose.c) * 100;

    return {
      ticker,
      name,
      price: currentPrice,
      change,
      changePercent,
      chartData: aggregates.map((agg) => ({
        date: new Date(agg.t).toISOString(),
        value: agg.o,
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

async function getPreviousDayClose(ticker: string) {
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: PolygonPreviousCloseResponse = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results[0];
        }
        return { c: 0, o: 0 };
    } catch (error) {
        console.error(`Error fetching previous day close for ${ticker}:`, error);
        return { c: 0, o: 0 };
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

    