"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { DollarSign, TrendingDown, TrendingUp, Minus } from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };
  
  const isPositive = stockData && stockData.change > 0;
  const isNegative = stockData && stockData.change < 0;
  const ChangeIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const changeColor = isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-muted-foreground";

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-20 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <DollarSign className="h-6 w-6 text-primary" />
          <span className="text-xl">MarketMood</span>
        </div>
        <div className="flex w-full items-center gap-4 md:ml-auto">
          {isPending && !stockData ? (
             <div className="hidden md:flex items-baseline gap-4">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-5 w-32" />
             </div>
          ) : stockData && (
            <div className="hidden md:flex items-baseline gap-4">
              <h1 className="text-2xl font-bold">{stockData.name} ({stockData.ticker})</h1>
              <div className="text-2xl font-bold">{formatCurrency(stockData.price)}</div>
              <div className={`flex items-center text-md ${changeColor}`}>
                <ChangeIcon className="mr-1 h-4 w-4" />
                <span>
                  {isPositive ? "+" : ""}
                  {formatCurrency(stockData.change)} ({stockData.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}
          <div className="ml-auto">
            <StockSearch onSearch={handleSearch} initialTicker={ticker} isSearching={isPending} />
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="lg:col-span-2 xl:col-span-3 space-y-6">
             <div className="grid gap-6 md:grid-cols-2">
                <div className="md:hidden">
                    {isPending && !stockData ? <StockInfoSkeleton /> : stockData && <StockInfoCard data={stockData} />}
                </div>
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
