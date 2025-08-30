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
  list_date: z.string().optional(),
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
    const details = await getStockDetails(ticker);
    if (!details) {
      console.error(`Failed to fetch details for ${ticker}`);
      return null;
    }

    const listDate = details.list_date;
    const aggregates = await getAggregateData(ticker, range, listDate);

    if (aggregates.length === 0) {
      console.error(`Failed to fetch aggregate data for ${ticker}`);
      return null;
    }
    
    const { name } = details;
    const currentPrice = aggregates[aggregates.length - 1].c;
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
    return null;
  }
}

function getAggregateDateRange(range: TimeRange, listDate?: string | null) {
  const today = new Date();
  let fromDate: Date;
  let timespan: string;
  let multiplier: number;

  switch (range) {
    case '1D':
      fromDate = new Date();
      // Go back a few days to ensure we capture the last trading day, accounting for weekends/holidays
      fromDate.setDate(today.getDate() - 4); 
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
      fromDate = listDate ? new Date(listDate) : new Date();
      if (!listDate) {
        fromDate.setFullYear(today.getFullYear() - 20); // Fallback to 20 years if no list date
      }
      timespan = 'day';
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

async function getAggregateData(ticker: string, range: TimeRange, listDate?: string | null) {
  const { from, to, multiplier, timespan } = getAggregateDateRange(range, listDate);
  const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data: PolygonAggregatesResponse = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return [];
    }
    
    // For 1D, find the most recent day with data and return only that day's data
    if (range === '1D') {
        const lastTimestamp = data.results[data.results.length - 1].t;
        const lastDate = new Date(lastTimestamp).toDateString();
        const filteredResults = data.results.filter(r => new Date(r.t).toDateString() === lastDate);
        return filteredResults.length > 0 ? filteredResults : data.results;
    }
    
    return data.results;
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
