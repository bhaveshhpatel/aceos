/**
 * LiteLLM AI Gateway
 * TS2-02 — LiteLLM Gateway with Full Routing Logic
 *
 * Single call point for all AI requests. Routing is driven entirely
 * by model_map.json — no model names are hardcoded here.
 * Includes retry with exponential backoff, usage logging, and
 * structured AIGatewayError for all failure paths.
 */

import modelMap from '@/model_map.json';
import { logAIUsage } from './logAIUsage';

export type RouteKey = keyof typeof modelMap.routes;

export interface AIRequest {
  route: RouteKey | string;
  messages: { role: 'system' | 'user' | 'assistant'; content: string | unknown[] }[];
  stream?: boolean;
  metadata?: Record<string, string>;
}

export interface AIResponse {
  content: string;
  model_used: string;
  provider: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  latency_ms: number;
}

export class AIGatewayError extends Error {
  constructor(
    public statusCode: number,
    public provider: string,
    public detail: unknown
  ) {
    super(`AI Gateway error from ${provider}: ${statusCode}`);
    this.name = 'AIGatewayError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryConfig: { retries: number; backoffMs: number }
): Promise<Response> {
  let lastError: Error = new Error('Unknown fetch error');

  for (let attempt = 0; attempt <= retryConfig.retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if ((response.status === 429 || response.status >= 500) && attempt < retryConfig.retries) {
        await sleep(retryConfig.backoffMs * Math.pow(2, attempt));
        continue;
      }
      return response;
    } catch (err) {
      lastError = err as Error;
      if (attempt < retryConfig.retries) {
        await sleep(retryConfig.backoffMs * Math.pow(2, attempt));
      }
    }
  }

  throw lastError;
}

export async function callAI(request: AIRequest): Promise<AIResponse> {
  const routes = modelMap.routes as Record<string, (typeof modelMap.routes)[RouteKey]>;
  const routeConfig = routes[request.route] ?? modelMap.routes.fallback;
  const providers = modelMap.providers as Record<string, { env_key: string; base_url: string }>;
  const providerConfig = providers[routeConfig.provider];
  const apiKey = process.env[providerConfig.env_key];

  if (!apiKey) {
    throw new AIGatewayError(500, routeConfig.provider, `Missing env var: ${providerConfig.env_key}`);
  }

  const startTime = Date.now();

  const payload = {
    model: routeConfig.model,
    messages: request.messages,
    max_tokens: routeConfig.max_tokens,
    temperature: routeConfig.temperature,
    stream: request.stream ?? false,
  };

  const response = await fetchWithRetry(
    `${providerConfig.base_url}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    },
    { retries: 2, backoffMs: 1000 }
  );

  if (!response.ok) {
    const errorDetail = await response.json().catch(() => ({ error: response.statusText }));
    throw new AIGatewayError(response.status, routeConfig.provider, errorDetail);
  }

  const data = await response.json();
  const latency = Date.now() - startTime;

  // Fire-and-forget — must not block or throw
  logAIUsage({
    route: request.route,
    model: routeConfig.model,
    provider: routeConfig.provider,
    prompt_tokens: data.usage?.prompt_tokens ?? 0,
    completion_tokens: data.usage?.completion_tokens ?? 0,
    latency_ms: latency,
    metadata: request.metadata,
  }).catch(console.error);

  return {
    content: data.choices[0].message.content as string,
    model_used: routeConfig.model,
    provider: routeConfig.provider,
    usage: {
      prompt_tokens: data.usage?.prompt_tokens ?? 0,
      completion_tokens: data.usage?.completion_tokens ?? 0,
      total_tokens: data.usage?.total_tokens ?? 0,
    },
    latency_ms: latency,
  };
}
