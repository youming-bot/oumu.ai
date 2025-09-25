"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import FileManager from "@/components/file-manager";
import Layout from "@/components/layout";
import SettingsPage from "@/components/settings-page";
import { useAppState, useFiles, useTranscriptionManager, useTranscripts } from "@/hooks";

export default function HomePage() {
  const router = useRouter();
  const [viewState, setViewState] = useState({
    currentView: "files" as "files" | "settings",
  });

  // 使用 hooks 获取数据
  const { updateFileUploadState } = useAppState();
  const { files, addFiles, deleteFile } = useFiles(updateFileUploadState);
  const { transcripts } = useTranscripts();
  const { transcriptionProgress, queueTranscription, retryTranscription } =
    useTranscriptionManager();

  const handleViewChange = useCallback((view: "files" | "settings") => {
    setViewState((prev) => ({ ...prev, currentView: view }));
  }, []);

  // transcriptionProgress 现在直接是 Map 类型，无需适配
  const progressMap = transcriptionProgress;

  // 适配文件处理函数
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      try {
        // 直接使用 File 数组，不需要转换为 FileList
        const uploadedFiles = await addFiles(files);

        // 为每个新上传的文件启动转录
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
    (fileId: number) => {
      deleteFile(fileId.toString());
    },
    [deleteFile],
  );

  // 处理重试转录
  const handleRetryTranscription = useCallback(
    (fileId: number) => {
      retryTranscription(fileId);
    },
    [retryTranscription],
  );

  const renderCurrentView = useMemo(() => {
    switch (viewState.currentView) {
      case "files":
        return (
          <FileManager
            files={files || []}
            transcripts={transcripts || []}
            transcriptionProgress={progressMap}
            onFilesSelected={handleFilesSelected}
            onPlayFile={(file) => {
              router.push(`/player/${file.id}`);
            }}
            onDeleteFile={handleDeleteFile}
            onRetryTranscription={handleRetryTranscription}
          />
        );
      case "settings":
        return <SettingsPage />;
      default:
        return (
          <FileManager
            files={files || []}
            transcripts={transcripts || []}
            transcriptionProgress={progressMap}
            onFilesSelected={handleFilesSelected}
            onPlayFile={(file) => {
              router.push(`/player/${file.id}`);
            }}
            onDeleteFile={handleDeleteFile}
            onRetryTranscription={handleRetryTranscription}
          />
        );
    }
  }, [
    viewState.currentView,
    files,
    transcripts,
    progressMap,
    handleFilesSelected,
    handleDeleteFile,
    handleRetryTranscription,
    router.push,
  ]);

  return (
    <Layout currentView={viewState.currentView} onViewChange={handleViewChange}>
      <div className="min-h-screen">{renderCurrentView}</div>
    </Layout>
  );
}
