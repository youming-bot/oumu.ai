import { type NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(_request: NextRequest) {
  try {
    // 简单的响应，不做任何复杂处理
    return NextResponse.json({
      success: true,
      message: 'Test endpoint received POST request',
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Test endpoint failed',
      },
      { status: 500 }
    );
  }
}
