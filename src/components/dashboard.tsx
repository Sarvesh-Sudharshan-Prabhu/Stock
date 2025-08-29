"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { DollarSign } from "lucide-react";

import { StockSearch } from "@/components/stock-search";
import { StockInfoCard, StockInfoSkeleton } from "@/components/stock-info-card";
import { StockChartCard, StockChartSkeleton } from "@/components/stock-chart-card";
import { SentimentAnalysisCard, SentimentAnalysisSkeleton } from "@/components/sentiment-analysis-card";
import { AiSummaryCard, AiSummarySkeleton } from "@/components/ai-summary-card";
import { OptionPricerCard } from "@/components/option-pricer-card";
import type { StockData, TimeRange } from "@/lib/types";
import { getStockData } from "@/lib/stock-api";
import { summarizeMarketSentiment } from "@/ai/flows/summarize-market-sentiment";
import type { SentimentAnalysisOutput } from "@/ai/flows/summarize-market-sentiment";
import { useToast } from "@/hooks/use-toast";

export function Dashboard() {
  const [ticker, setTicker] = useState("AAPL");
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [aiSummary, setAiSummary] = useState<SentimentAnalysisOutput | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("1D");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchData = useCallback((newTicker: string, newTimeRange: TimeRange) => {
    startTransition(async () => {
      try {
        const [stock, summaryRes] = await Promise.all([
          getStockData(newTicker, newTimeRange),
          summarizeMarketSentiment({ ticker: newTicker }),
        ]);

        if (stock) {
          setStockData(stock);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Could not load stock data for ${newTicker}.`,
          });
          setStockData(null);
        }
        setAiSummary(summaryRes);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to fetch data for ${newTicker}. Please try again.`,
        });
        setStockData(null);
        setAiSummary(null);
      }
    });
  }, [toast]);

  useEffect(() => {
    fetchData(ticker, timeRange);

    // Auto-refresh every 60 seconds
    const intervalId = setInterval(() => {
      fetchData(ticker, timeRange);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [fetchData, ticker, timeRange]);

  const handleSearch = (newTicker: string) => {
    setTicker(newTicker.toUpperCase());
    setStockData(null);
    setAiSummary(null);
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
              {isPending && !stockData ? <StockInfoSkeleton /> : stockData && <StockInfoCard data={stockData} />}
              {isPending && !stockData ? <SentimentAnalysisSkeleton /> : stockData && <SentimentAnalysisCard data={stockData.sentiment} />}
            </div>
            {isPending && !stockData ? <StockChartSkeleton /> : stockData && <StockChartCard data={stockData} timeRange={timeRange} setTimeRange={setTimeRange} />}
            {isPending && !aiSummary ? <AiSummarySkeleton /> : aiSummary && <AiSummaryCard data={aiSummary} />}
          </div>
          <div className="lg:col-span-1 xl:col-span-1">
            <OptionPricerCard stockPrice={stockData?.price} />
          </div>
        </div>
      </main>
    </div>
  );
}
