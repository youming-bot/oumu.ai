import { Groq } from 'groq-sdk';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const language = (formData.get('language') as string) || 'en';
    const model = (formData.get('model') as string) || 'whisper-large-v3-turbo';
    const responseFormat = (formData.get('response_format') as string) || 'verbose_json';
    const temperature = (formData.get('temperature') as string) || '0';

    if (!file) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No audio file provided',
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 检查 Groq API 密钥是否存在
    if (!process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'CONFIGURATION_ERROR',
            message:
              'GROQ_API_KEY environment variable is not set. Please configure your API key in the environment settings.',
          },
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // 直接发送文件给Groq进行处理
    const transcription = (await groq.audio.transcriptions.create({
      file: file,
      model: model,
      language: language,
      response_format: responseFormat as 'verbose_json',
      temperature: parseFloat(temperature),
    })) as any;

    // 处理转录结果，确保格式正确
    const segments = Array.isArray(transcription.segments)
      ? transcription.segments.map((segment: any, index: number) => ({
          ...segment,
          id: segment.id ?? index + 1,
        }))
      : [];

    const response = {
      success: true,
      data: {
        text: transcription.text,
        language: transcription.language || language,
        duration: transcription.duration,
        segments: segments,
        task: transcription.task,
        x_groq: transcription.x_groq,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'TRANSCRIPTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }
}
