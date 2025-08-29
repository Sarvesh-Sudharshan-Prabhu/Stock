"use client";

import { Bot } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SentimentData } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface AiSummaryCardProps {
  data: NonNullable<SentimentData>;
}

export function AiSummaryCard({ data }: AiSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI-Powered Summary
        </CardTitle>
        <CardDescription>
          An AI-generated analysis of factors impacting market sentiment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground">{data.summary}</p>
      </CardContent>
    </Card>
  );
}

export function AiSummarySkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <Skeleton className="h-6 w-48" />
        </CardTitle>
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
    </Card>
  );
}
