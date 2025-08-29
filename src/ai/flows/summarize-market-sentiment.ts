'use server';
/**
 * @fileOverview An AI agent that analyzes news and social media to provide a sentiment analysis and summary for a given stock ticker.
 *
 * - summarizeMarketSentiment - A function that takes a stock ticker and returns a comprehensive sentiment analysis.
 * - SentimentAnalysisInput - The input type for the summarizeMarketSentiment function.
 * - SentimentAnalysisOutput - The return type for the summarizeMarketSentiment function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getNews } from '@/lib/stock-api';
import { SentimentDataSchema } from '@/lib/types';


const SentimentAnalysisInputSchema = z.object({
  ticker: z.string().describe('The stock ticker to analyze sentiment for.'),
});
export type SentimentAnalysisInput = z.infer<
  typeof SentimentAnalysisInputSchema
>;

export type SentimentAnalysisOutput = z.infer<typeof SentimentDataSchema>;

export async function summarizeMarketSentiment(
  input: SentimentAnalysisInput
): Promise<SentimentAnalysisOutput> {
  return summarizeMarketSentimentFlow(input);
}

const fetchSentimentData = ai.defineTool(
  {
    name: 'fetchStockNews',
    description:
      'Fetches news headlines for a given stock ticker.',
    inputSchema: z.object({
      ticker: z
        .string()
        .describe('The stock ticker to fetch sentiment data for.'),
    }),
    outputSchema: z.array(z.object({ title: z.string(), description: z.string().optional() })),
  },
  async (input) => {
    console.log(`Fetching news for ${input.ticker}`);
    // Return only the top 10 articles to stay within token limits
    return (await getNews(input.ticker)).slice(0, 10);
  }
);

const prompt = ai.definePrompt({
  name: 'summarizeMarketSentimentPrompt',
  input: { schema: SentimentAnalysisInputSchema },
  output: { schema: SentimentDataSchema },
  tools: [fetchSentimentData],
  prompt: `You are a financial analyst specializing in market sentiment.
  Analyze the news headlines provided by the fetchStockNews tool for the stock with ticker {{{ticker}}}.
  Based on these headlines, provide a concise summary of the overall market sentiment for this stock.
  Focus on whether the news is generally positive, negative, or neutral and what the key driving factors are.
  
  In addition to the summary, provide an aggregated sentiment analysis by determining the proportions of positive, negative, and neutral sentiment from the articles.
  
  Output should be in the specified JSON format.
  `,
});

const summarizeMarketSentimentFlow = ai.defineFlow(
  {
    name: 'summarizeMarketSentimentFlow',
    inputSchema: SentimentAnalysisInputSchema,
    outputSchema: SentimentDataSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
       return {
        sentiment: {
          positive: 0,
          negative: 0,
          neutral: 1,
        },
        summary: 'Could not generate a sentiment summary at this time.',
      };
    }
    return output;
  }
);
