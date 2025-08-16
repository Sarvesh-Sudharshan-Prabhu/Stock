'use server';

/**
 * @fileOverview An AI agent that analyzes the sentiment of news articles and social media posts related to a specific stock ticker.
 *
 * - analyzeStockSentiment - A function that takes a stock ticker as input and returns the aggregated sentiment analysis.
 * - AnalyzeStockSentimentInput - The input type for the analyzeStockSentiment function.
 * - AnalyzeStockSentimentOutput - The return type for the analyzeStockSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeStockSentimentInputSchema = z.object({
  ticker: z.string().describe('The stock ticker symbol to analyze.'),
});
export type AnalyzeStockSentimentInput = z.infer<typeof AnalyzeStockSentimentInputSchema>;

const AnalyzeStockSentimentOutputSchema = z.object({
  sentiment: z
    .object({
      positive: z.number().describe('The proportion of positive sentiment.'),
      negative: z.number().describe('The proportion of negative sentiment.'),
      neutral: z.number().describe('The proportion of neutral sentiment.'),
      summary: z.string().describe('A summary of the overall sentiment.'),
    })
    .describe('The aggregated sentiment analysis results.'),
});
export type AnalyzeStockSentimentOutput = z.infer<typeof AnalyzeStockSentimentOutputSchema>;

export async function analyzeStockSentiment(input: AnalyzeStockSentimentInput): Promise<AnalyzeStockSentimentOutput> {
  return analyzeStockSentimentFlow(input);
}

const analyzeStockSentimentPrompt = ai.definePrompt({
  name: 'analyzeStockSentimentPrompt',
  input: {schema: AnalyzeStockSentimentInputSchema},
  output: {schema: AnalyzeStockSentimentOutputSchema},
  prompt: `You are a financial analyst who specializes in gauging stock market sentiment.

  Analyze the news articles and social media posts related to {{ticker}} and provide an aggregated sentiment analysis.
  Determine the proportions of positive, negative, and neutral sentiment.
  Also provide a short summary.

  Output should be in JSON format.
  {
    "sentiment": {
      "positive": 0.3,
      "negative": 0.2,
      "neutral": 0.5,
      "summary": "Overall, the sentiment surrounding {{ticker}} is slightly positive, with some concerns about recent performance.",
    }
  }`,
});

const analyzeStockSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeStockSentimentFlow',
    inputSchema: AnalyzeStockSentimentInputSchema,
    outputSchema: AnalyzeStockSentimentOutputSchema,
  },
  async input => {
    const {output} = await analyzeStockSentimentPrompt(input);
    return output!;
  }
);
