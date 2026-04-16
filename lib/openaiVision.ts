import OpenAI from 'openai';

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  return new OpenAI({ apiKey });
}

function extractJsonText(text: string) {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch?.[1]?.trim() || text.trim();
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  return firstBrace >= 0 && lastBrace > firstBrace ? candidate.slice(firstBrace, lastBrace + 1) : candidate;
}

export async function parseOpenAIVisionJSONFromUrl<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  imageUrl: string;
  model?: string;
  maxTokens?: number;
}): Promise<T> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: params.model || 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    max_completion_tokens: params.maxTokens || 1400,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: params.systemPrompt,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: params.userPrompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: params.imageUrl,
              detail: 'low',
            },
          },
        ],
      },
    ],
  });

  const text = response.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('Unexpected empty response from OpenAI vision');
  }

  return JSON.parse(extractJsonText(text)) as T;
}
