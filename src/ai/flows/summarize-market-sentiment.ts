// Summarizes market sentiment for a given stock ticker by analyzing relevant news and social media data.
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getNews } from '@/lib/stock-api';

const SentimentAnalysisInputSchema = z.object({
  ticker: z.string().describe('The stock ticker to analyze sentiment for.'),
});
export type SentimentAnalysisInput = z.infer<
  typeof SentimentAnalysisInputSchema
>;

const SentimentAnalysisOutputSchema = z.object({
  summary: z
    .string()
    .describe('A summary of the factors impacting the stock sentiment.'),
});
export type SentimentAnalysisOutput = z.infer<
  typeof SentimentAnalysisOutputSchema
>;

export async function summarizeMarketSentiment(
  input: SentimentAnalysisInput
): Promise<SentimentAnalysisOutput> {
  return summarizeMarketSentimentFlow(input);
}

const fetchSentimentData = ai.defineTool(
  {
    name: 'fetchStockNews',
    description:
      'Fetches news and social media sentiment data for a given stock ticker.',
    inputSchema: z.object({
      ticker: z
        .string()
        .describe('The stock ticker to fetch sentiment data for.'),
    }),
    outputSchema: z.array(z.object({ title: z.string(), description: z.string().optional() })),
  },
  async (input) => {
    console.log(`Fetching news for ${input.ticker}`);
    return getNews(input.ticker);
  }
);

const prompt = ai.definePrompt({
  name: 'summarizeMarketSentimentPrompt',
  input: { schema: SentimentAnalysisInputSchema },
  output: { schema: SentimentAnalysisOutputSchema },
  tools: [fetchSentimentData],
  prompt: `You are a financial analyst summarizing market sentiment for stocks.
  Analyze the news headlines fetched by the fetchStockNews tool for the given stock ticker and provide a concise summary of the factors impacting the sentiment.

  Use the fetchStockNews tool to get the data for the ticker: {{{ticker}}}.`,
});

const summarizeMarketSentimentFlow = ai.defineFlow(
  {
    name: 'summarizeMarketSentimentFlow',
    inputSchema: SentimentAnalysisInputSchema,
    outputSchema: SentimentAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      return { summary: "Could not generate a summary at this time."};
    }
    return output;
  }
);
