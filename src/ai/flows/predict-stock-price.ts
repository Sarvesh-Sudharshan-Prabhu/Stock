'use server';
/**
 * @fileOverview An AI agent that predicts future stock price movements based on historical data.
 *
 * - predictStockPrice - A function that takes a stock ticker and historical data to return a price prediction.
 * - PredictStockPriceInput - The input type for the predictStockPrice function.
 * - PredictStockPriceOutput - The return type for the predictStockPrice function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PredictStockPriceInputSchema = z.object({
  ticker: z.string().describe('The stock ticker symbol.'),
  chartData: z
    .array(z.object({ date: z.string(), value: z.number() }))
    .describe('Historical price data for the stock.'),
});
export type PredictStockPriceInput = z.infer<typeof PredictStockPriceInputSchema>;

const PredictStockPriceOutputSchema = z.object({
  prediction_summary: z.string().describe('A detailed summary of the price prediction for the next 30 days.'),
  target_price: z.number().describe('The predicted target price for the stock in 30 days.'),
  confidence_level: z.enum(['High', 'Medium', 'Low']).describe('The confidence level of the prediction.'),
});
export type PredictStockPriceOutput = z.infer<typeof PredictStockPriceOutputSchema>;


export async function predictStockPrice(input: PredictStockPriceInput): Promise<PredictStockPriceOutput> {
  return predictStockPriceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictStockPricePrompt',
  input: { schema: PredictStockPriceInputSchema },
  output: { schema: PredictStockPriceOutputSchema },
  prompt: `You are a quantitative financial analyst specializing in stock price prediction using technical analysis.
  
  Analyze the provided historical price data for the stock with ticker {{{ticker}}}.
  The data is provided as a series of dates and closing prices.
  
  Based on this historical data, identify key trends, support and resistance levels, and any recognizable chart patterns.
  
  Provide a prediction for the stock's price movement over the next 30 days.
  Your prediction should include:
  1. A detailed summary explaining your reasoning, citing the patterns and trends you identified.
  2. A specific target price for the end of the 30-day period.
  3. A confidence level for your prediction (High, Medium, or Low).

  Historical Data:
  {{#each chartData}}
  - Date: {{date}}, Price: {{value}}
  {{/each}}
  `,
});

const predictStockPriceFlow = ai.defineFlow(
  {
    name: 'predictStockPriceFlow',
    inputSchema: PredictStockPriceInputSchema,
    outputSchema: PredictStockPriceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate a price prediction.');
    }
    return output;
  }
);
