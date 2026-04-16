import Anthropic from '@anthropic-ai/sdk';

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  return new Anthropic({ apiKey });
}

function extractText(content: Anthropic.Messages.Message['content']) {
  return content
    .filter((part): part is Extract<(typeof content)[number], { type: 'text' }> => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim();
}

function extractJsonText(text: string) {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch?.[1]?.trim() || text.trim();
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  return firstBrace >= 0 && lastBrace > firstBrace ? candidate.slice(firstBrace, lastBrace + 1) : candidate;
}

function normalizeImageMediaType(contentType?: string | null): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  const lowered = (contentType || '').toLowerCase();
  if (lowered.includes('png')) return 'image/png';
  if (lowered.includes('webp')) return 'image/webp';
  if (lowered.includes('gif')) return 'image/gif';
  return 'image/jpeg';
}

async function fetchImageAsClaudeSource(imageUrl: string) {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch image for Claude Vision: ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    data: buffer.toString('base64'),
    mediaType: normalizeImageMediaType(res.headers.get('content-type')),
  };
}

export async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textParts = extractText(response.content);
  if (!textParts) {
    throw new Error('Unexpected empty response from Claude');
  }

  return textParts;
}

export async function parseClaudeJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const text = await callClaude(systemPrompt, userPrompt);
  return JSON.parse(extractJsonText(text)) as T;
}

export async function parseClaudeVisionJSONFromUrl<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  imageUrl: string;
  model?: string;
  maxTokens?: number;
}): Promise<T> {
  const anthropic = getClient();
  const image = await fetchImageAsClaudeSource(params.imageUrl);

  const response = await anthropic.messages.create({
    model: params.model || 'claude-sonnet-4-20250514',
    max_tokens: params.maxTokens || 1800,
    system: params.systemPrompt,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: image.mediaType,
            data: image.data,
          },
        },
        {
          type: 'text',
          text: params.userPrompt,
        },
      ],
    }],
  });

  const text = extractText(response.content);
  if (!text) {
    throw new Error('Unexpected empty response from Claude Vision');
  }

  return JSON.parse(extractJsonText(text)) as T;
}
