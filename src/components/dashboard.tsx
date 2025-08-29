"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { DollarSign, TrendingDown, TrendingUp, Minus } from "lucide-react";

import { CompanySearch } from "@/components/company-search";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export function Dashboard() {
  const [ticker, setTicker] = useState("AAPL");
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [aiSummary, setAiSummary] = useState<SentimentAnalysisOutput | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("1D");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchData = useCallback((newTicker: string) => {
    startTransition(async () => {
      try {
        // Keep previous data while new data is loading for a smoother experience
        // setStockData(null); 
        // setAiSummary(null);

        const [stock, summaryRes] = await Promise.all([
          getStockData(newTicker, timeRange),
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
          // Don't null out data if the API fails, keep the old data
          // setStockData(null); 
        }
        setAiSummary(summaryRes);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to fetch data for ${newTicker}. Please try again.`,
        });
        // setStockData(null);
        // setAiSummary(null);
      }
    });
  }, [toast, timeRange]);

  useEffect(() => {
    if (ticker) {
      fetchData(ticker);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);


  const handleSearch = (newTicker: string) => {
    setTicker(newTicker.toUpperCase());
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
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <DollarSign className="h-6 w-6 text-primary" />
          <span className="text-xl">MarketMood</span>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mb-8">
            {isPending && !stockData ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-10 w-32" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-10 w-32" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-10 w-32" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-10 w-32" /></CardContent></Card>
                </div>
            ) : stockData && (
                <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                         {stockData.logoUrl && (
                          <Image 
                            src={stockData.logoUrl}
                            alt={`${stockData.name} logo`}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        )}
                        <h1 className="text-3xl font-bold">{stockData.name} ({stockData.ticker})</h1>
                      </div>
                       <div className="w-full max-w-xs">
                          <CompanySearch onSearch={handleSearch} isSearching={isPending} />
                       </div>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Current Price</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{formatCurrency(stockData.price)}</div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Today's Change</CardTitle>
                                <ChangeIcon className={`h-4 w-4 ${changeColor}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-4xl font-bold ${changeColor}`}>
                                    {isPositive ? "+" : ""}
                                    {formatCurrency(stockData.change)}
                                </div>
                                <p className={`text-xs ${changeColor}`}>
                                    {isPositive ? "+" : ""}
                                    {stockData.changePercent.toFixed(2)}%
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Sentiment</CardTitle>
                            </CardHeader>
                            <CardContent>
                                 <div className="text-4xl font-bold capitalize">
                                    {
                                        Object.entries(stockData.sentiment.sentiment).reduce((a, b) => b[1] > a[1] ? b : a)[0]
                                    }
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Time Range</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{timeRange}</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="lg:col-span-2 xl:col-span-3 space-y-6">
             <div className="grid gap-6 md:grid-cols-2">
                {isPending && !stockData ? <SentimentAnalysisSkeleton /> : stockData && <SentimentAnalysisCard data={stockData.sentiment} />}
                {isPending && !aiSummary ? <AiSummarySkeleton /> : aiSummary && <AiSummaryCard data={aiSummary} />}
             </div>
            {isPending && !stockData ? <StockChartSkeleton /> : stockData && <StockChartCard data={stockData} timeRange={timeRange} setTimeRange={setTimeRange} />}
          </div>
          <div className="lg:col-span-1 xl:col-span-1">
            <OptionPricerCard stockPrice={stockData?.price} />
          </div>
        </div>
      </main>
    </div>
  );
}
