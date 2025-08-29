"use client";

import { BarChart, LineChart as LineChartIcon } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import type { StockData, TimeRange } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface StockChartCardProps {
  data: StockData;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (dateString: string, range: TimeRange) => {
  const date = new Date(dateString);
  switch (range) {
    case '1D': return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case '1W': return date.toLocaleDateString([], { weekday: 'short' });
    case '1M': return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    default: return date.toLocaleDateString();
  }
};

export function StockChartCard({ data, timeRange, onTimeRangeChange }: StockChartCardProps) {
  const isPositive = data.change >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="grid gap-2">
          <CardTitle>Chart</CardTitle>
          <CardDescription>
            Performance for {data.ticker}
          </CardDescription>
        </div>
        <Tabs value={timeRange} onValueChange={(value) => onTimeRangeChange(value as TimeRange)} className="space-x-2">
          <TabsList>
            <TabsTrigger value="1D">1D</TabsTrigger>
            <TabsTrigger value="1W">1W</TabsTrigger>
            <TabsTrigger value="1M">1M</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.chartData}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatDate(value, timeRange)}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value)}
                domain={['dataMin', 'dataMax']}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(label, timeRange)}
                            </span>
                            <span className="font-bold text-foreground">
                              {formatCurrency(payload[0].value as number)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                strokeWidth={2}
                stroke={isPositive ? "hsl(var(--chart-1))" : "#ef4444"}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function StockChartSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="grid gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-12" />
          <Skeleton className="h-9 w-12" />
          <Skeleton className="h-9 w-12" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <Skeleton className="h-full w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

    