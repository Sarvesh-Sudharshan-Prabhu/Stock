"use client";

import { Bot, Smile, Frown, Meh } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import type { SentimentData } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface SentimentAnalysisCardProps {
  data: NonNullable<SentimentData>;
}

export function SentimentAnalysisCard({ data }: SentimentAnalysisCardProps) {
  const { positive, negative, neutral } = data.sentiment;
  const { summary } = data;

  const chartData = [
    {
      sentiment: "Positive",
      value: positive,
      fill: "hsl(var(--chart-1))",
      icon: Smile,
    },
    {
      sentiment: "Negative",
      value: negative,
      fill: "hsl(var(--destructive))",
      icon: Frown,
    },
    {
      sentiment: "Neutral",
      value: neutral,
      fill: "hsl(var(--muted-foreground))",
      icon: Meh,
    },
  ];

  const chartConfig = {
    value: {
      label: "Sentiment",
    },
    Positive: {
      label: "Positive",
      color: "hsl(var(--chart-1))",
    },
    Negative: {
      label: "Negative",
      color: "hsl(var(--destructive))",
    },
    Neutral: {
      label: "Neutral",
      color: "hsl(var(--muted-foreground))",
    },
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Sentiment Analysis
        </CardTitle>
        <CardDescription>{summary}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square h-full max-h-[250px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="sentiment"
                  innerRadius={50}
                  strokeWidth={5}
                >
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.sentiment}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
          <div className="space-y-4">
            {chartData.map((entry) => (
              <div
                key={entry.sentiment}
                className="flex items-center gap-2"
              >
                <entry.icon
                  className="h-5 w-5"
                  style={{ color: entry.fill }}
                />
                <span className="text-sm font-medium">{entry.sentiment}</span>
                <span className="ml-auto text-sm text-muted-foreground">
                  {Math.round(entry.value * 100)}%
                </span>
              </div>
            ))}
          </div>
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
      <CardContent className="grid md:grid-cols-2 gap-6 items-center">
        <Skeleton className="h-48 w-48 rounded-full mx-auto" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div className="flex items-center gap-2" key={i}>
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-12 ml-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
