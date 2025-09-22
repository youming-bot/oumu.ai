import type { Term } from "@/types/database";

const BASE_URL = process.env.OPENROUTER_BASE_URL;
const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL;

export interface PostProcessRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage?: string;
  annotations?: boolean;
  furigana?: boolean;
  terminology?: boolean;
}

export interface PostProcessResponse {
  normalizedText: string;
  translation?: string;
  annotations?: string[];
  furigana?: string;
  terminology?: Record<string, string>;
  processingTime: number;
}

export interface PostProcessSegment {
  originalText: string;
  normalizedText: string;
  translation?: string;
  annotations?: string[];
  furigana?: string;
  start: number;
  end: number;
}

export interface PostProcessOptions {
  targetLanguage?: string;
  enableAnnotations?: boolean;
  enableFurigana?: boolean;
  enableTerminology?: boolean;
  customTerminology?: Term[];
  maxRetries?: number;
  timeout?: number;
}

export class OpenRouterClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown,
  ) {
    super(message);
    this.name = "OpenRouterClientError";
  }
}

export class OpenRouterRateLimitError extends OpenRouterClientError {
  constructor(
    message: string,
    public readonly retryAfter?: number,
  ) {
    super(message, 429);
    this.name = "OpenRouterRateLimitError";
  }
}

const DEFAULT_OPTIONS: PostProcessOptions = {
  targetLanguage: "en",
  enableAnnotations: true,
  enableFurigana: true,
  enableTerminology: true,
  maxRetries: 3,
};

/**
 * 发送请求到OpenRouter API
 */
async function makeRequest(
  endpoint: string,
  options: RequestInit,
  retries: number = 3,
): Promise<Response> {
  if (!API_KEY) {
    throw new OpenRouterClientError("OpenRouter API key not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${API_KEY}`,
        "HTTP-Referer":
          process.env.NODE_ENV === "production"
            ? process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"
            : "http://localhost:3000",
        "X-Title": "Shadowing Learning",
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        throw new OpenRouterRateLimitError("Rate limit exceeded");
      }
      throw new OpenRouterClientError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
      );
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof OpenRouterRateLimitError && retries > 0) {
      const retryAfter = (error as OpenRouterRateLimitError).retryAfter || 1000;
      await delayMs(retryAfter);
      return makeRequest(endpoint, options, retries - 1);
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new OpenRouterClientError("Request timeout", 408);
    }

    throw error;
  }
}

/**
 * 构建提示词用于后处理
 */
function buildPrompt(
  text: string,
  sourceLanguage: string,
  targetLanguage?: string,
  enableAnnotations: boolean = true,
  enableFurigana: boolean = true,
  enableTerminology: boolean = true,
  customTerminology?: Term[],
): string {
  let basePrompt = `You are a professional language teacher specializing in Japanese language learning and shadowing practice.

Task: Process the following ${sourceLanguage} text for language learners.

Input:
${text}

Requirements:
1. Normalize the text (remove filler words, fix grammar, etc.)
2. ${targetLanguage ? `Provide translation to ${targetLanguage}` : "Keep original language"}`;

  if (enableAnnotations) {
    basePrompt += `
3. Add grammatical and cultural annotations`;
  }

  if (enableFurigana && sourceLanguage === "ja") {
    basePrompt += `
4. Include furigana for kanji`;
  }

  if (enableTerminology) {
    basePrompt += `
5. Extract key vocabulary and provide explanations`;
  }

  if (customTerminology && customTerminology.length > 0) {
    basePrompt += `

Custom Terminology (use these translations):
${customTerminology.map((term) => `- ${term.word}: ${term.reading} (${term.meaning})`).join("\n")}`;
  }

  basePrompt += `

Output format:
{
  "normalizedText": "Clean, normalized text",
  "translation": "Translation if requested",
  "annotations": ["List of annotations"],
  "furigana": "Text with furigana if applicable",
  "terminology": {"term": "reading and definition"}
}`;

  return basePrompt;
}

/**
 * 解析OpenRouter响应
 */
function parseResponse(responseText: string): PostProcessResponse {
  try {
    const response = JSON.parse(responseText);
    return {
      normalizedText: response.normalizedText || response.text || "",
      translation: response.translation,
      annotations: response.annotations || [],
      furigana: response.furigana,
      terminology: response.terminology || {},
      processingTime: response.processingTime || 0,
    };
  } catch (error) {
    throw new OpenRouterClientError(
      "Failed to parse OpenRouter response",
      500,
      error,
    );
  }
}

/**
 * 处理单个文本段
 */
export async function postProcessText(
  text: string,
  sourceLanguage: string,
  options: PostProcessOptions = {},
): Promise<PostProcessResponse> {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();

  const prompt = buildPrompt(
    text,
    sourceLanguage,
    finalOptions.targetLanguage,
    finalOptions.enableAnnotations,
    finalOptions.enableFurigana,
    finalOptions.enableTerminology,
  );

  const response = await makeRequest("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a professional language teacher specializing in Japanese language learning and shadowing practice. Provide accurate, educational responses that help learners understand and practice the language.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      maxTokens: 2000,
    }),
  });

  const result = await response.json();
  const responseText = result.choices?.[0]?.message?.content || "";

  const processedResponse = parseResponse(responseText);
  processedResponse.processingTime = Date.now() - startTime;

  return processedResponse;
}

/**
 * 批量处理文本段
 */
export async function postProcessSegments(
  segments: Array<{ text: string; start: number; end: number }>,
  sourceLanguage: string,
  options: PostProcessOptions = {},
): Promise<PostProcessSegment[]> {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };

  // Process segments in batches to avoid overwhelming the API
  const batchSize = 5;
  const results: PostProcessSegment[] = [];

  for (let i = 0; i < segments.length; i += batchSize) {
    const batch = segments.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (segment) => {
        const response = await postProcessText(
          segment.text,
          sourceLanguage,
          finalOptions,
        );
        return {
          originalText: segment.text,
          normalizedText: response.normalizedText,
          translation: response.translation,
          annotations: response.annotations,
          furigana: response.furigana,
          start: segment.start,
          end: segment.end,
        };
      }),
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * 使用自定义术语处理文本
 */
export async function postProcessWithTerminology(
  text: string,
  sourceLanguage: string,
  terminology: Term[],
  options: PostProcessOptions = {},
): Promise<PostProcessResponse> {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();

  const prompt = buildPrompt(
    text,
    sourceLanguage,
    finalOptions.targetLanguage,
    finalOptions.enableAnnotations,
    finalOptions.enableFurigana,
    finalOptions.enableTerminology,
    terminology,
  );

  const response = await makeRequest("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a professional language teacher specializing in Japanese language learning and shadowing practice. Use the provided terminology consistently in your translations and explanations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      maxTokens: 2000,
    }),
  });

  const result = await response.json();
  const responseText = result.choices?.[0]?.message?.content || "";

  const processedResponse = parseResponse(responseText);
  processedResponse.processingTime = Date.now() - startTime;

  return processedResponse;
}

/**
 * 验证API配置
 */
export function validateConfiguration(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!API_KEY) {
    errors.push("OpenRouter API key is not configured");
  }

  if (!BASE_URL) {
    errors.push("OpenRouter base URL is not configured");
  }

  if (!MODEL) {
    errors.push("OpenRouter model is not configured");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 获取支持的模型列表
 */
export function getSupportedModels(): Array<{
  id: string;
  name: string;
  description: string;
}> {
  return [
    {
      id: "deepseek/deepseek-chat-v3.1:free",
      name: "DeepSeek Chat v3.1",
      description: "Free tier model with good multilingual capabilities",
    },
    {
      id: "anthropic/claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet",
      description:
        "High-performance model with excellent language understanding",
    },
    {
      id: "openai/gpt-4o",
      name: "GPT-4o",
      description: "Latest OpenAI model with multimodal capabilities",
    },
  ];
}

/**
 * 延迟函数
 */
async function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
