"use client";

import type { FileRow, TranscriptRow } from "@/types/database";
import type { TranscriptionProgress } from "@/lib/transcription-service";

interface FileCardNewProps {
  file: FileRow;
  transcript?: TranscriptRow;
  transcriptionProgress?: TranscriptionProgress;
  onPlay: (fileId: string) => void;
  onDelete: (fileId: string) => void;
  onRetry: (fileId: string) => void;
  isPlaying?: boolean;
  isCurrentFile?: boolean;
}

export default function FileCardNew({
  file,
  transcript,
  transcriptionProgress,
  onPlay,
  onDelete,
  onRetry,
  isPlaying = false,
  isCurrentFile = false,
}: FileCardNewProps) {
  const getStatus = () => {
    if (!transcript) return { text: "等待处理", icon: "hourglass_empty", color: "text-gray-500" };

    switch (transcript.status) {
      case "completed":
        return { text: "转录成功", icon: "check_circle", color: "status-success" };
      case "processing":
        return { text: "正在转录...", icon: "pending", color: "status-processing" };
      case "failed":
        return { text: "转录失败", icon: "warning", color: "status-warning" };
      case "pending":
        return { text: "等待处理", icon: "hourglass_empty", color: "text-gray-500" };
      default:
        return { text: "未知状态", icon: "help", color: "text-gray-500" };
    }
  };

  const status = getStatus();

  const formatDuration = (duration?: number) => {
    if (!duration || Number.isNaN(duration) || duration <= 0) {
      return null;
    }

    const totalSeconds = Math.floor(duration);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getFileId = () => {
    if (!file.id) {
      throw new Error("文件ID不存在");
    }
    return file.id.toString();
  };

  const handlePlay = () => {
    onPlay(getFileId());
  };

  const handleRetry = () => {
    onRetry(getFileId());
  };

  const handleDelete = () => {
    onDelete(getFileId());
  };

  return (
    <div className="file-card flex items-center justify-between">
      <div className="flex items-center gap-4">
        {status.icon === "pending" ? (
          <div className="loading-spinner" />
        ) : (
          <span className={`material-symbols-outlined text-4xl ${status.color}`}>
            {status.icon}
          </span>
        )}

        <div>
          <p className="text-file-name break-words">{file.name}</p>
          {formatDuration(file.duration) && (
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-300">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>{formatDuration(file.duration)}</span>
            </p>
          )}
          {(transcriptionProgress?.status === "processing" ||
            transcriptionProgress?.status === "pending") && (
            <div className="mt-2 flex items-center gap-2 text-sm text-[var(--player-accent-color)]">
              <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
              <span>
                {transcriptionProgress.status === "processing" ? "正在转录..." : "排队中"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {transcript?.status === "completed" && (
          <button
            type="button"
            className={`btn-play ${isPlaying && isCurrentFile ? "bg-blue-500" : ""}`}
            onClick={handlePlay}
            title="播放"
          >
            <span className="material-symbols-outlined text-3xl text-white">
              {isPlaying && isCurrentFile ? "pause" : "play_arrow"}
            </span>
          </button>
        )}

        {(transcript?.status === "failed" || transcript?.status === "pending") && (
          <button
            type="button"
            className="btn-retry"
            onClick={handleRetry}
            title={transcript.status === "pending" ? "开始转录" : "重试"}
          >
            <span className="material-symbols-outlined text-white">
              {transcript.status === "pending" ? "play_arrow" : "replay"}
            </span>
          </button>
        )}

        <button type="button" className="btn-delete" onClick={handleDelete} title="删除">
          <span className="material-symbols-outlined text-gray-500 dark:text-white">delete</span>
        </button>
      </div>
    </div>
  );
}
