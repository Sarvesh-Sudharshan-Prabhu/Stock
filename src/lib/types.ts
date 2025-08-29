import { z } from 'zod';
import type { AnalyzeStockSentimentOutput } from "@/ai/flows/analyze-stock-sentiment";

export interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  chartData: { date: string; value: number }[];
  sentiment: AnalyzeStockSentimentOutput;
  logoUrl?: string;
}

export type TimeRange = "1D" | "1W" | "1M";

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
