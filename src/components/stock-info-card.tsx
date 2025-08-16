"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StockData } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StockInfoCardProps {
  data: StockData;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

export function StockInfoCard({ data }: StockInfoCardProps) {
  const isPositive = data.change > 0;
  const isNegative = data.change < 0;

  const ChangeIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const changeColor = isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-muted-foreground";

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{data.name} ({data.ticker})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold">{formatCurrency(data.price)}</div>
        <div className={`flex items-center text-sm ${changeColor}`}>
          <ChangeIcon className="mr-1 h-4 w-4" />
          <span>
            {isPositive ? "+" : ""}
            {formatCurrency(data.change)} ({data.changePercent.toFixed(2)}%)
          </span>
          <span className="text-muted-foreground ml-2">Today</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function StockInfoSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-3/5" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-1/2 mb-2" />
        <Skeleton className="h-5 w-2/5" />
      </CardContent>
    </Card>
  );
}
