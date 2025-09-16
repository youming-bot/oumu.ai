export interface FileRow {
  id?: number;
  name: string;
  size: number;
  type: string;
  blob: Blob;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranscriptRow {
  id?: number;
  fileId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  rawText?: string;
  language?: string;
  error?: string;
  processingTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface Segment {
  id?: number;
  transcriptId: number;
  start: number;
  end: number;
  text: string;
  normalizedText?: string;
  translation?: string;
  annotations?: string[];
  furigana?: string;
  wordTimestamps?: WordTimestamp[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FileWithTranscripts extends FileRow {
  transcripts: TranscriptRow[];
}

export interface TranscriptWithSegments extends TranscriptRow {
  segments: Segment[];
}

export interface Term {
  id?: number;
  word: string;
  reading?: string;
  meaning: string;
  category?: string;
  examples?: string[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DatabaseStats {
  totalFiles: number;
  totalTranscripts: number;
  totalSegments: number;
  processingStatus: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}