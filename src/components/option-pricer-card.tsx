"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Calculator } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { calculateBlackScholes } from "@/lib/black-scholes";
import { Separator } from "./ui/separator";

const formSchema = z.object({
  stockPrice: z.coerce.number().positive({ message: "Must be positive" }),
  strikePrice: z.coerce.number().positive({ message: "Must be positive" }),
  timeToMaturity: z.coerce.number().positive({ message: "Must be positive" }),
  riskFreeRate: z.coerce.number().min(0, { message: "Cannot be negative" }),
  volatility: z.coerce.number().min(0, { message: "Cannot be negative" }),
});

interface OptionPricerCardProps {
  stockPrice?: number;
}

export function OptionPricerCard({ stockPrice }: OptionPricerCardProps) {
  const [optionPrices, setOptionPrices] = useState<{ callPrice: number; putPrice: number } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stockPrice: stockPrice || 100,
      strikePrice: 100,
      timeToMaturity: 0.25, // 3 months
      riskFreeRate: 0.05, // 5%
      volatility: 0.2, // 20%
    },
  });

  useEffect(() => {
    if (stockPrice) {
      form.setValue("stockPrice", parseFloat(stockPrice.toFixed(2)));
    }
  }, [stockPrice, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const prices = calculateBlackScholes(values);
    setOptionPrices(prices);
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Black-Scholes Pricer
        </CardTitle>
        <CardDescription>Calculate theoretical option prices.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="stockPrice" render={({ field }) => (
                <FormItem><FormLabel>Stock Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="strikePrice" render={({ field }) => (
                <FormItem><FormLabel>Strike Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="timeToMaturity" render={({ field }) => (
                <FormItem><FormLabel>Time to Maturity (Yrs)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="riskFreeRate" render={({ field }) => (
                <FormItem><FormLabel>Risk-Free Rate</FormLabel><FormControl><Input type="number" placeholder="e.g., 0.05" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="volatility" render={({ field }) => (
                <FormItem><FormLabel>Volatility</FormLabel><FormControl><Input type="number" placeholder="e.g., 0.2" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <Button type="submit" className="w-full">Calculate</Button>
          </form>
        </Form>
        {optionPrices && (
          <div className="mt-6">
            <Separator />
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Call Price</p>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(optionPrices.callPrice)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Put Price</p>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(optionPrices.putPrice)}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
