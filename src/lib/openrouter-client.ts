import { Term } from '@/types/database';

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3.1:free';

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
  maxRetries?: number;
  timeout?: number;
}

export class OpenRouterClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'OpenRouterClientError';
  }
}

export class OpenRouterRateLimitError extends OpenRouterClientError {
  constructor(
    message: string,
    public readonly retryAfter?: number
  ) {
    super(message, 429);
    this.name = 'OpenRouterRateLimitError';
  }
}

export class OpenRouterClient {
  private static readonly BASE_URL = OPENROUTER_BASE_URL;
  private static readonly API_KEY = OPENROUTER_API_KEY;
  private static readonly MODEL = OPENROUTER_MODEL;

  private static readonly DEFAULT_OPTIONS: PostProcessOptions = {
    targetLanguage: 'en',
    enableAnnotations: true,
    enableFurigana: true,
    enableTerminology: true,
    maxRetries: 3,
  };

  private static async makeRequest(
    endpoint: string,
    options: RequestInit,
    retries: number = 3
  ): Promise<Response> {
    if (!this.API_KEY) {
      throw new OpenRouterClientError('OpenRouter API key not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Shadowing Learning',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        throw new OpenRouterRateLimitError('Rate limit exceeded', retryAfter);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new OpenRouterClientError(
          `OpenRouter API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return response;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof OpenRouterClientError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new OpenRouterClientError('Request timeout');
      }

      if (retries > 0) {
        console.log(`Retrying request... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
        return this.makeRequest(endpoint, options, retries - 1);
      }

      throw new OpenRouterClientError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  static async postProcessText(
    text: string,
    sourceLanguage: string = 'ja',
    options: PostProcessOptions = {},
    terminology?: Term[]
  ): Promise<PostProcessResponse> {
    const startTime = Date.now();
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      if (!text.trim()) {
        throw new OpenRouterClientError('Text cannot be empty');
      }

      const prompt = this.buildProcessingPrompt(
        text,
        sourceLanguage,
        mergedOptions.targetLanguage || 'en',
        mergedOptions,
        terminology
      );

      const response = await this.makeRequest('/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that processes and enhances text for language learning.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.1,
        }),
      });

      const data = await response.json();
      const resultText = data.choices?.[0]?.message?.content;

      if (!resultText) {
        throw new OpenRouterClientError('No response from OpenRouter');
      }

      const processedResult = this.parseResponse(resultText);

      return {
        ...processedResult,
        processingTime: Date.now() - startTime,
      };

    } catch (error) {
      console.error('OpenRouter post-processing failed:', error);
      throw error;
    }
  }

  static async postProcessSegments(
    segments: PostProcessSegment[],
    sourceLanguage: string = 'ja',
    options: PostProcessOptions = {},
    terminology?: Term[]
  ): Promise<PostProcessSegment[]> {
    const processedSegments: PostProcessSegment[] = [];
    
    for (const segment of segments) {
      try {
        const result = await this.postProcessText(
          segment.originalText,
          sourceLanguage,
          options,
          terminology
        );

        processedSegments.push({
          ...segment,
          normalizedText: result.normalizedText,
          translation: result.translation,
          annotations: result.annotations,
          furigana: result.furigana,
        });

        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Failed to process segment: ${segment.originalText}`, error);
        processedSegments.push(segment);
      }
    }

    return processedSegments;
  }

  private static buildProcessingPrompt(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    options: PostProcessOptions,
    terminology?: Term[]
  ): string {
    const tasks: string[] = ['Normalize the text into proper sentences'];

    if (options.enableAnnotations) {
      tasks.push('Add linguistic annotations (grammar points, usage notes)');
    }

    if (options.enableFurigana && sourceLanguage === 'ja') {
      tasks.push('Add furigana readings for kanji');
    }

    if (options.targetLanguage && options.targetLanguage !== sourceLanguage) {
      tasks.push(`Provide ${targetLanguage} translation`);
    }

    if (options.enableTerminology) {
      tasks.push('Identify and explain key terminology');
    }

    let terminologyContext = '';
    if (terminology && terminology.length > 0 && options.enableTerminology) {
      terminologyContext = `\n\nAvailable terminology for reference:\n${terminology.map(term =>
        `- ${term.word}${term.reading ? ` (${term.reading})` : ''}: ${term.meaning}${term.examples && term.examples.length > 0 ?
          `\n  Examples: ${term.examples.join(', ')}` : ''}${term.tags && term.tags.length > 0 ?
          `\n  Tags: ${term.tags.join(', ')}` : ''}`
      ).join('\n')}`;
    }

    return `
Please process the following ${sourceLanguage} text for language learning purposes:

"""
${text}
"""${terminologyContext}

Tasks to perform:
1. ${tasks.join('\n2. ')}

Please respond with a JSON object containing:
- normalizedText: the cleaned and normalized text
- ${options.targetLanguage && options.targetLanguage !== sourceLanguage ? 'translation: the English translation\n- ' : ''}${options.enableAnnotations ? 'annotations: array of linguistic annotations\n- ' : ''}${options.enableFurigana && sourceLanguage === 'ja' ? 'furigana: text with furigana readings\n- ' : ''}${options.enableTerminology ? 'terminology: object of key terms and explanations' : ''}

Return only valid JSON, no other text.
    `.trim();
  }

  private static parseResponse(responseText: string): Omit<PostProcessResponse, 'processingTime'> {
    try {
      const jsonMatch = responseText.match(/\{([\s\S]*)\}/);
      if (!jsonMatch) {
        throw new OpenRouterClientError('Invalid response format from OpenRouter');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        normalizedText: parsed.normalizedText || '',
        translation: parsed.translation,
        annotations: parsed.annotations,
        furigana: parsed.furigana,
        terminology: parsed.terminology,
      };

    } catch (error) {
      console.error('Failed to parse OpenRouter response:', responseText);
      throw new OpenRouterClientError(
        'Failed to parse processing response',
        undefined,
        responseText
      );
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest('/models', {
        method: 'GET',
      });
      return true;
    } catch {
      return false;
    }
  }

  static getConfig() {
    return {
      baseUrl: this.BASE_URL,
      model: this.MODEL,
      hasApiKey: !!this.API_KEY,
    };
  }
}