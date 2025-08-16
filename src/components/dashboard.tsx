"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { DollarSign, BarChart, Bot, Calculator } from "lucide-react";

import { StockSearch } from "@/components/stock-search";
import { StockInfoCard, StockInfoSkeleton } from "@/components/stock-info-card";
import { StockChartCard, StockChartSkeleton } from "@/components/stock-chart-card";
import { SentimentAnalysisCard, SentimentAnalysisSkeleton } from "@/components/sentiment-analysis-card";
import { AiSummaryCard, AiSummarySkeleton } from "@/components/ai-summary-card";
import { OptionPricerCard } from "@/components/option-pricer-card";
import type { StockData, TimeRange } from "@/lib/types";
import { analyzeStockSentiment } from "@/ai/flows/analyze-stock-sentiment";
import type { AnalyzeStockSentimentOutput } from "@/ai/flows/analyze-stock-sentiment";
import { summarizeMarketSentiment } from "@/ai/flows/summarize-market-sentiment";
import type { SentimentAnalysisOutput } from "@/ai/flows/summarize-market-sentiment";
import { useToast } from "@/hooks/use-toast";

const stockNames: { [key: string]: string } = {
  AAPL: "Apple Inc.",
  GOOGL: "Alphabet Inc.",
  MSFT: "Microsoft Corp.",
  AMZN: "Amazon.com, Inc.",
  TSLA: "Tesla, Inc.",
  META: "Meta Platforms, Inc.",
};

// Mock data generation
const generateMockStockData = (ticker: string, range: TimeRange): StockData => {
  const name = stockNames[ticker.toUpperCase()] || `${ticker.toUpperCase()} Company`;
  const price = parseFloat((Math.random() * 1000 + 50).toFixed(2));
  const change = parseFloat(((Math.random() - 0.5) * 40).toFixed(2));
  const changePercent = parseFloat(((change / (price - change)) * 100).toFixed(2));

  let days;
  if (range === "1D") days = 24 * 60; // minutes
  else if (range === "1W") days = 7;
  else days = 30;

  let lastValue = price - change;
  const chartData = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    if (range === "1D") date.setMinutes(date.getMinutes() - (days - i));
    else date.setDate(date.getDate() - (days - i));
    
    lastValue += (Math.random() - 0.5) * 2;
    return {
      date: date.toISOString(),
      value: parseFloat(lastValue.toFixed(2)),
    };
  });

  return { ticker, name, price, change, changePercent, chartData };
};

export function Dashboard() {
  const [ticker, setTicker] = useState("AAPL");
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [sentiment, setSentiment] = useState<AnalyzeStockSentimentOutput | null>(null);
  const [aiSummary, setAiSummary] = useState<SentimentAnalysisOutput | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("1D");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchData = useCallback((newTicker: string, newTimeRange: TimeRange) => {
    startTransition(async () => {
      try {
        // In a real app, you'd make API calls here.
        // We use mock data for demonstration.
        const [stock, sentimentRes, summaryRes] = await Promise.all([
          Promise.resolve(generateMockStockData(newTicker, newTimeRange)),
          analyzeStockSentiment({ ticker: newTicker }),
          summarizeMarketSentiment({ ticker: newTicker }),
        ]);

        setStockData(stock);
        setSentiment(sentimentRes);
        setAiSummary(summaryRes);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to fetch data for ${newTicker}. Please try again.`,
        });
        setStockData(null);
        setSentiment(null);
        setAiSummary(null);
      }
    });
  }, [toast]);

  useEffect(() => {
    fetchData(ticker, timeRange);
  }, [fetchData, ticker, timeRange]);

  const handleSearch = (newTicker: string) => {
    setTicker(newTicker.toUpperCase());
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <DollarSign className="h-6 w-6 text-primary" />
          <span className="text-xl">MarketMood</span>
        </div>
        <div className="flex w-full flex-1 items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <StockSearch onSearch={handleSearch} initialTicker={ticker} isSearching={isPending} />
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="lg:col-span-2 xl:col-span-3 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {isPending ? <StockInfoSkeleton /> : stockData && <StockInfoCard data={stockData} />}
              {isPending ? <SentimentAnalysisSkeleton /> : sentiment && <SentimentAnalysisCard data={sentiment} />}
            </div>
            {isPending ? <StockChartSkeleton /> : stockData && <StockChartCard data={stockData} timeRange={timeRange} setTimeRange={setTimeRange} />}
            {isPending ? <AiSummarySkeleton /> : aiSummary && <AiSummaryCard data={aiSummary} />}
          </div>
          <div className="lg:col-span-1 xl:col-span-1">
            <OptionPricerCard stockPrice={stockData?.price} />
          </div>
        </div>
      </main>
    </div>
  );
}
