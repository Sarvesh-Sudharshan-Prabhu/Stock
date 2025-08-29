import { z } from 'zod';

export const SentimentDataSchema = z.object({
  sentiment: z
    .object({
      positive: z.number().describe('The proportion of positive sentiment.'),
      negative: z.number().describe('The proportion of negative sentiment.'),
      neutral: z.number().describe('The proportion of neutral sentiment.'),
    })
    .describe('The aggregated sentiment analysis results.'),
  summary: z.string().describe('A summary of the overall sentiment.'),
});

export type SentimentData = z.infer<typeof SentimentDataSchema> | null;


export interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  chartData: { date: string; value: number }[];
  sentiment: SentimentData;
  logoUrl?: string;
}

export type TimeRange = "1D" | "1W" | "1M" | "6M" | "1Y" | "All";

export const NewsArticleSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});
export type NewsArticle = z.infer<typeof NewsArticleSchema>;

export const TickerSearchSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  branding: z.object({
    logo_url: z.string().optional(),
  }).optional(),
});
export const TickerSearchResultSchema = z.array(TickerSearchSchema);
export type TickerSearchResult = z.infer<typeof TickerSearchResultSchema>;
