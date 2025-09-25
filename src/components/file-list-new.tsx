"use client";

import { useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import type { FileRow, TranscriptRow } from "@/types/database";
import FileCardNew from "./file-card-new";
import type { TranscriptionProgress } from "@/lib/transcription-service";

interface FileListNewProps {
  files: FileRow[];
  transcripts: TranscriptRow[];
  transcriptionProgress?: Map<string, TranscriptionProgress>;
  onPlayFile: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onRetryTranscription: (fileId: string) => void;
  isPlaying?: boolean;
  currentFileId?: string;
  className?: string;
}

// 虚拟化列表项组件
const VirtualizedFileCard = ({
  index,
  style,
  data,
}: {
  index: number;
  style: React.CSSProperties;
  data: {
    files: FileRow[];
    transcriptMap: Map<number, TranscriptRow>;
    transcriptionProgress: Map<string, TranscriptionProgress>;
    onPlayFile: (fileId: string) => void;
    onDeleteFile: (fileId: string) => void;
    onRetryTranscription: (fileId: string) => void;
    isPlaying: boolean;
    currentFileId?: string;
  };
}) => {
  const {
    files,
    transcriptMap,
    transcriptionProgress,
    onPlayFile,
    onDeleteFile,
    onRetryTranscription,
    isPlaying,
    currentFileId,
  } = data;

  const file = files[index];
  if (!file?.id) return null;

  const transcript = transcriptMap.get(file.id);
  const progress = transcriptionProgress.get(file.id.toString());

  return (
    <div style={style}>
      <FileCardNew
        file={file}
        transcript={transcript}
        transcriptionProgress={progress}
        onPlay={onPlayFile}
        onDelete={onDeleteFile}
        onRetry={onRetryTranscription}
        isPlaying={isPlaying}
        isCurrentFile={currentFileId === file.id.toString()}
      />
    </div>
  );
};

export default function FileListNew({
  files,
  transcripts,
  transcriptionProgress = new Map(),
  onPlayFile,
  onDeleteFile,
  onRetryTranscription,
  isPlaying = false,
  currentFileId,
  className = "",
}: FileListNewProps) {
  // 创建transcript映射以便快速查找
  const transcriptMap = useMemo(() => {
    return new Map(transcripts.map((t) => [t.fileId!, t]));
  }, [transcripts]);

  // 准备虚拟化列表的数据
  const itemData = useMemo(
    () => ({
      files,
      transcriptMap,
      transcriptionProgress,
      onPlayFile,
      onDeleteFile,
      onRetryTranscription,
      isPlaying,
      currentFileId,
    }),
    [
      files,
      transcriptMap,
      transcriptionProgress,
      onPlayFile,
      onDeleteFile,
      onRetryTranscription,
      isPlaying,
      currentFileId,
    ],
  );

  // 使用虚拟化的阈值
  const USE_VIRTUALIZATION_THRESHOLD = 20;

  // 如果没有文件，显示空状态
  if (files.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">📁</span>
        <h3 className="text-xl font-semibold text-gray-500 mb-2">还没有文件</h3>
        <p className="text-gray-400">上传音频或视频文件开始转录</p>
      </div>
    );
  }

  // 如果文件数量少，直接渲染
  if (files.length < USE_VIRTUALIZATION_THRESHOLD) {
    return (
      <div className={className}>
        <h2 className="text-2xl font-bold mb-4 text-[#4a4a4a] dark:text-[var(--text-color)]">
          文件列表
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {files.map((file) => {
            if (!file.id) return null;
            const transcript = transcriptMap.get(file.id);

            return (
              <FileCardNew
                key={file.id}
                file={file}
                transcript={transcript}
                transcriptionProgress={transcriptionProgress.get(file.id?.toString())}
                onPlay={onPlayFile}
                onDelete={onDeleteFile}
                onRetry={onRetryTranscription}
                isPlaying={isPlaying}
                isCurrentFile={currentFileId === file.id?.toString()}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // 文件数量多时使用虚拟化
  return (
    <div className={className}>
      <h2 className="text-2xl font-bold mb-4 text-[#4a4a4a] dark:text-[var(--text-color)]">
        文件列表 ({files.length} 个文件)
      </h2>

      <div className="border rounded-lg overflow-hidden">
        <div className="w-full" style={{ height: "600px" }}>
          {(() => {
            const virtualizedListWidth =
              typeof window !== "undefined" ? Math.min(window.innerWidth - 80, 1200) : 960;

            return (
              <List
                height={600}
                itemCount={files.length}
                itemSize={150} // 固定高度，足以容纳大多数 FileCard
                itemData={itemData}
                width={virtualizedListWidth}
              >
                {VirtualizedFileCard}
              </List>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
