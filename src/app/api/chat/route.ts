import { createGroq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { getContent } from '@/actions/content';
import { buildKnowledgeBase } from '@/lib/knowledge-base';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: UIMessage[] };

  const content = await getContent();
  const systemPrompt = buildKnowledgeBase(content);

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 512,
  });

  return result.toUIMessageStreamResponse();
}
