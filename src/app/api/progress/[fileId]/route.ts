import { NextRequest, NextResponse } from 'next/server';
import { TranscriptionService } from '@/lib/transcription-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const resolvedParams = await params;
    const fileId = parseInt(resolvedParams.fileId, 10);
    
    if (isNaN(fileId)) {
      return NextResponse.json(
        { error: 'Invalid file ID' },
        { status: 400 }
      );
    }

    const progress = TranscriptionService.getTranscriptionProgress(fileId);
    
    if (!progress) {
      return NextResponse.json(
        { error: 'No progress found for this file' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      progress,
    });

  } catch (error) {
    console.error('Error fetching progress:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch progress',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}