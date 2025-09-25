"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import FileList from "@/components/file-list-new";
import FileUploadArea from "@/components/file-upload-area-new";
import Navigation from "@/components/navigation-new";
import SettingsPage from "@/components/settings-page";
import StatsCards from "@/components/stats-cards";
import { useAppState, useFiles, useTranscriptionManager, useTranscripts } from "@/hooks";

export default function HomePage() {
  const router = useRouter();
  const [viewState, setViewState] = useState({
    currentView: "files" as "files" | "settings",
  });

  // 使用 hooks 获取数据
  const { fileUploadState, updateFileUploadState } = useAppState();
  const { files, addFiles, deleteFile } = useFiles(updateFileUploadState);
  const { transcripts } = useTranscripts();
  const { transcriptionProgress, queueTranscription, retryTranscription } =
    useTranscriptionManager();
  const isPlaying = false;
  const currentFileId = undefined;

  const handleViewChange = useCallback((view: "files" | "settings") => {
    setViewState((prev) => ({ ...prev, currentView: view }));
  }, []);

  // 转换 transcriptionProgress 的键从 number 到 string 以匹配组件期望
  const progressMap = new Map(
    Array.from(transcriptionProgress.entries()).map(([key, value]) => [key.toString(), value]),
  );

  // 适配文件处理函数
  const handleFilesSelected = useCallback(
    async (selectedFiles: File[]) => {
      try {
        const uploadedFiles = await addFiles(selectedFiles);

        uploadedFiles.forEach((file) => {
          if (file.id) {
            queueTranscription(file);
          }
        });
      } catch (_error) {
        const { toast } = await import("sonner");
        toast.error("文件上传失败");
      }
    },
    [addFiles, queueTranscription],
  );

  const handleDeleteFile = useCallback(
    (fileId: string) => {
      deleteFile(fileId);
    },
    [deleteFile],
  );

  // 处理重试转录
  const handleRetryTranscription = useCallback(
    (fileId: string) => {
      retryTranscription(parseInt(fileId, 10));
    },
    [retryTranscription],
  );

  // 处理播放文件
  const handlePlayFile = useCallback(
    (fileId: string) => {
      router.push(`/player/${fileId}`);
    },
    [router],
  );

  const isUploading = fileUploadState.isUploading;
  const uploadProgress = fileUploadState.uploadProgress;

  const renderCurrentView = () => {
    switch (viewState.currentView) {
      case "files":
        return (
          <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8 mt-24">
            <div className="mx-auto max-w-5xl">
              <div className="space-y-8">
                <StatsCards />

                <div className="mb-8">
                  <FileUploadArea
                    onFilesSelected={handleFilesSelected}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                  />
                </div>

                <div>
                  <FileList
                    files={files || []}
                    transcripts={transcripts || []}
                    transcriptionProgress={progressMap}
                    onPlayFile={handlePlayFile}
                    onDeleteFile={handleDeleteFile}
                    onRetryTranscription={handleRetryTranscription}
                    isPlaying={isPlaying}
                    currentFileId={currentFileId}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8 mt-24">
            <div className="mx-auto max-w-5xl">
              <SettingsPage />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <Navigation currentView={viewState.currentView} onViewChange={handleViewChange} />

      <main className="flex-1">{renderCurrentView()}</main>
    </div>
  );
}
