import { type NextRequest, NextResponse } from 'next/server';
import { TranscriptionService } from '@/lib/transcription-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const resolvedParams = await params;
    const fileId = parseInt(resolvedParams.fileId, 10);

    if (Number.isNaN(fileId)) {
      return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 });
    }

    const progress = await TranscriptionService.getTranscriptionProgress(fileId);

    if (!progress) {
      return NextResponse.json({ error: 'No progress found for this file' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch progress',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
