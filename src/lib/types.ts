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
