"use client";

import { useState, useCallback, useTransition } from "react";
import { Wand2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { predictStockPrice } from "@/ai/flows/predict-stock-price";
import type { PredictStockPriceOutput } from "@/ai/flows/predict-stock-price";
import type { StockData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";

interface PricePredictorCardProps {
  stockData: StockData | null;
  isPending: boolean;
}

export function PricePredictorCard({ stockData, isPending: isDashboardLoading }: PricePredictorCardProps) {
  const [prediction, setPrediction] = useState<PredictStockPriceOutput | null>(null);
  const [isPredicting, startPrediction] = useTransition();
  const { toast } = useToast();

  const handlePredict = useCallback(() => {
    if (!stockData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Stock data not available. Please select a stock first.",
      });
      return;
    }

    startPrediction(async () => {
      try {
        setPrediction(null);
        const result = await predictStockPrice({
          ticker: stockData.ticker,
          chartData: stockData.chartData,
        });
        setPrediction(result);
      } catch (error) {
        console.error("Failed to generate prediction:", error);
        toast({
          variant: "destructive",
          title: "Prediction Failed",
          description: "Could not generate a price prediction at this time.",
        });
      }
    });
  }, [stockData, toast]);

  const isLoading = isDashboardLoading || isPredicting;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };
  
  const getConfidenceColor = (level: 'High' | 'Medium' | 'Low') => {
    switch (level) {
        case 'High': return 'bg-green-500';
        case 'Medium': return 'bg-yellow-500';
        case 'Low': return 'bg-red-500';
        default: return 'bg-gray-500';
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          AI Price Forecaster
        </CardTitle>
        <CardDescription>Predict future stock prices using AI analysis.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <Button onClick={handlePredict} disabled={isLoading} className="w-full">
          {isPredicting ? "Analyzing..." : `Forecast ${stockData?.ticker || 'Stock'} Price`}
        </Button>

        {isLoading && !prediction && (
            <div className="mt-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>
        )}
        
        {prediction && (
          <div className="mt-6">
            <Separator />
            <div className="mt-4 space-y-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">30-Day Target Price</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(prediction.target_price)}</p>
                </div>
                 <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <Badge className={getConfidenceColor(prediction.confidence_level)}>
                        {prediction.confidence_level}
                    </Badge>
                </div>
                <div>
                    <p className="text-sm font-medium mb-2">Analysis:</p>
                    <p className="text-sm text-muted-foreground">{prediction.prediction_summary}</p>
                </div>
            </div>
          </div>
        )}
      </CardContent>
       <CardFooter className="mt-auto pt-4">
         <CardDescription className="text-xs text-muted-foreground">
            Disclaimer: This is an AI-generated prediction based on historical data and is not financial advice. Market conditions can change rapidly.
         </CardDescription>
      </CardFooter>
    </Card>
  );
}