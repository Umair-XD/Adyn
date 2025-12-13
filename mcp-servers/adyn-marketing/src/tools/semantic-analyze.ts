import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '../lib/ai-config.js';

export interface SemanticAnalyzeInput {
  text: string;
}

export interface SemanticAnalyzeOutput {
  summary: string;
  keywords: string[];
  value_proposition: string;
  brand_tone: string;
  audience_persona: string;
  category: string;
  use_cases: string[];
  target_segments: Array<{
    segment: string;
    description: string;
    pain_points: string[];
  }>;
}

const schema = z.object({
  summary: z.string(),
  keywords: z.array(z.string()),
  value_proposition: z.string(),
  brand_tone: z.string(),
  audience_persona: z.string(),
  category: z.string(),
  use_cases: z.array(z.string()),
  target_segments: z.array(z.object({
    segment: z.string(),
    description: z.string(),
    pain_points: z.array(z.string())
  }))
});

export async function semanticAnalyze(input: SemanticAnalyzeInput): Promise<SemanticAnalyzeOutput> {
  try {
    const prompt = `Analyze this product/service content and provide detailed marketing insights:

${input.text}

Provide a JSON response with:
1. summary: A concise 2-3 sentence summary of what this product/service is
2. keywords: Array of 10-15 relevant marketing keywords
3. value_proposition: The core value proposition in one sentence
4. brand_tone: The brand tone (professional, luxury, playful, innovative, eco-conscious, etc.)
5. audience_persona: Primary target audience description
6. category: Product category (fashion, technology, health & wellness, beauty, food & beverage, etc.)
7. use_cases: Array of 3-5 specific use cases or scenarios where this product solves problems
8. target_segments: Array of 3-5 specific audience segments with:
   - segment: Name of the segment (e.g., "Office Workers", "Software Engineers", "Gamers")
   - description: Who they are and why they need this
   - pain_points: Array of 2-3 specific pain points this product solves for them

Be specific and actionable. For example, if it's blue light glasses, identify segments like "Remote Workers", "Gamers", "Software Developers" with their specific needs.`;

    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema,
      prompt,
      system: 'You are a marketing analysis expert. Provide detailed, actionable insights.',
    });

    return object;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`AI semantic analysis failed: ${errorMessage}`);
  }
}
