export interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  chartData: { date: string; value: number }[];
}

export type TimeRange = "1D" | "1W" | "1M";
