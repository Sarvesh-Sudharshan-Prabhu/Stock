"use client";

import { Bot, Smile, Frown, Meh } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AnalyzeStockSentimentOutput } from "@/ai/flows/analyze-stock-sentiment";
import { Skeleton } from "@/components/ui/skeleton";

interface SentimentAnalysisCardProps {
  data: AnalyzeStockSentimentOutput;
}

export function SentimentAnalysisCard({ data }: SentimentAnalysisCardProps) {
  const { positive, negative, neutral, summary } = data.sentiment;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Sentiment Analysis
        </CardTitle>
        <CardDescription>{summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Smile className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium">Positive</span>
            <span className="ml-auto text-sm text-muted-foreground">{Math.round(positive * 100)}%</span>
          </div>
          <Progress value={positive * 100} className="h-2 [&>div]:bg-green-500" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Frown className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium">Negative</span>
            <span className="ml-auto text-sm text-muted-foreground">{Math.round(negative * 100)}%</span>
          </div>
          <Progress value={negative * 100} className="h-2 [&>div]:bg-red-500" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Meh className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium">Neutral</span>
            <span className="ml-auto text-sm text-muted-foreground">{Math.round(neutral * 100)}%</span>
          </div>
          <Progress value={neutral * 100} className="h-2 [&>div]:bg-yellow-500" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SentimentAnalysisSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <Skeleton className="h-6 w-40" />
        </CardTitle>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div className="space-y-2" key={i}>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-12 ml-auto" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
