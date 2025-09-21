'use client';

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import AudioPlayer from '@/components/audio-player';
import ExportImport from '@/components/export-import';
import FileList from '@/components/file-list';
import FileUpload from '@/components/file-upload';
import Layout from '@/components/layout';
import SubtitleDisplay from '@/components/subtitle-display';
import TerminologyGlossary from '@/components/terminology-glossary';
// Import custom hooks for state management
import {
  useAppState,
  useAudioPlayer,
  useFiles,
  useTerms,
  useTranscriptionProgress,
  useTranscripts,
} from '@/hooks';
import { useMemoryCleanup } from '@/hooks/useMemoryCleanup';
import { handleAndShowError } from '@/lib/error-handler';
import { FileUploadUtils } from '@/lib/file-upload';
import { type TranscriptionProgress, TranscriptionService } from '@/lib/transcription-service';
import type { FileRow } from '@/types/database';

export default function Home() {
  // Use memory cleanup hook for global resource management
  useMemoryCleanup();

  // Use custom hooks for state management
  const { files, isLoading, loadFiles } = useFiles();
  const { terms, addTerm, updateTerm, deleteTerm } = useTerms();
  const {
    transcripts,
    segments,
    loadTranscriptsByFileId,
    loadSegmentsByTranscriptId,
    clearSegments,
  } = useTranscripts();
  const {
    audioPlayerState,
    audioUrl,
    loopStart,
    loopEnd,
    setAudioFile,
    setLoopPoints,
    updatePlayerState,
    handleSeek,
    clearAudio,
  } = useAudioPlayer();
  const { transcriptionProgress } = useTranscriptionProgress(files, transcripts);
  const { viewState, fileUploadState, setViewState, updateViewState, updateFileUploadState } =
    useAppState();

  const handleFilesSelected = useCallback(
    async (selectedFiles: File[]) => {
      if (selectedFiles.length === 0) return;

      updateFileUploadState({
        selectedFiles,
        isUploading: true,
        uploadProgress: 0,
      });

      try {
        // Process files sequentially to avoid overwhelming the system
        const uploadPromises = selectedFiles.map(async (file, index) => {
          try {
            const fileId = await FileUploadUtils.uploadFile(file);

            // Update progress
            updateFileUploadState({
              uploadProgress: Math.round(((index + 1) / selectedFiles.length) * 100),
            });

            TranscriptionService.transcribeAudio(fileId, {
              language: 'ja',
              onProgress: (_progress: TranscriptionProgress) => {
                // Progress callback - intentionally empty for now
              },
            })
              .then((_transcriptResult) => {
                toast.success(`Transcription completed for ${file.name}`);
              })
              .catch((transcriptionError) => {
                toast.error(`Transcription failed for ${file.name}: ${transcriptionError.message}`);
              });

            return { success: true, fileId };
          } catch (error) {
            handleAndShowError(error, 'processFile', `Failed to process ${file.name}`);
            return { success: false, error, fileName: file.name };
          }
        });

        // Wait for all uploads to complete
        const results = await Promise.all(uploadPromises);

        // Check if any uploads failed
        const failedUploads = results.filter((result) => !result.success);
        if (failedUploads.length > 0) {
          // Handle failed uploads if needed
        }

        // Reload files to show the new ones
        await loadFiles();

        updateFileUploadState({
          isUploading: false,
          uploadProgress: 100,
          selectedFiles: [],
        });
      } catch (error) {
        handleAndShowError(error, 'fileUpload');
        updateFileUploadState({
          isUploading: false,
          uploadProgress: 0,
          selectedFiles: [],
        });
      }
    },
    [updateFileUploadState, loadFiles]
  );

  const handlePlayFile = useCallback(
    async (file: FileRow) => {
      // Clear previous audio
      clearAudio();

      setViewState({
        ...viewState,
        currentView: 'player',
        selectedFile: file,
      });
      updatePlayerState({ isPlaying: true });

      try {
        // Create object URL for the audio file
        if (file.id) {
          const blob = await FileUploadUtils.getFileBlob(file.id);
          const audioFile = new File([blob], file.name, { type: file.type });
          setAudioFile(audioFile);
        }

        // Load transcripts for this file
        if (!file.id) {
          toast.error('File ID is missing');
          return;
        }
        const fileTranscripts = await TranscriptionService.getFileTranscripts(file.id);
        // Store transcripts for the progress polling
        await loadTranscriptsByFileId(file.id);

        // If there are completed transcripts, load their segments
        const completedTranscript = fileTranscripts.find((t) => t.status === 'completed');
        if (completedTranscript) {
          if (!completedTranscript.id) {
            toast.error('Transcript ID is missing');
            return;
          }
          await loadSegmentsByTranscriptId(completedTranscript.id);
        } else {
          // No completed transcript, use empty segments
          clearSegments();
        }
      } catch (error) {
        handleAndShowError(error, 'loadFileData');
        clearSegments();
      }
    },
    [
      clearAudio,
      viewState,
      setViewState,
      updatePlayerState,
      setAudioFile,
      loadTranscriptsByFileId,
      loadSegmentsByTranscriptId,
      clearSegments,
    ]
  );

  const handleDeleteFile = useCallback(
    async (fileId: number) => {
      try {
        await FileUploadUtils.deleteFile(fileId);
        // Reload files to reflect the deletion
        await loadFiles();
      } catch (error) {
        handleAndShowError(error, 'deleteFile');
      }
    },
    [loadFiles]
  );

  const handlePlay = useCallback(() => {
    updatePlayerState({ isPlaying: true });
  }, [updatePlayerState]);

  const handlePause = useCallback(() => {
    updatePlayerState({ isPlaying: false });
  }, [updatePlayerState]);

  const handleSetLoop = useCallback(
    (start: number, end: number) => {
      setLoopPoints(start, end);
    },
    [setLoopPoints]
  );

  const handleClearLoop = useCallback(() => {
    setLoopPoints(undefined, undefined);
  }, [setLoopPoints]);

  const handleSetAbLoop = useCallback(
    (start: number, end: number) => {
      setLoopPoints(start, end);
    },
    [setLoopPoints]
  );

  const handleClearAbLoop = useCallback(() => {
    setLoopPoints(undefined, undefined);
  }, [setLoopPoints]);

  const renderCurrentView = useMemo(() => {
    switch (viewState.currentView) {
      case 'upload':
        return (
          <div className="space-y-6">
            <FileUpload
              onFilesSelected={handleFilesSelected}
              isUploading={fileUploadState.isUploading}
              uploadProgress={fileUploadState.uploadProgress}
            />
          </div>
        );

      case 'files':
        return (
          <div className="space-y-6">
            <h2 className="mb-6 font-semibold text-2xl">Your Files</h2>
            <FileList
              files={files}
              transcripts={transcripts}
              transcriptionProgress={transcriptionProgress}
              onPlayFile={handlePlayFile}
              onDeleteFile={handleDeleteFile}
              isLoading={isLoading}
            />
          </div>
        );

      case 'player':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="mb-6 font-semibold text-2xl">
                {viewState.selectedFile?.name || 'Audio Player'}
              </h2>
              <AudioPlayer
                audioUrl={audioUrl}
                currentTime={audioPlayerState.currentTime}
                duration={viewState.selectedFile?.duration || 0}
                isPlaying={audioPlayerState.isPlaying}
                onPlay={handlePlay}
                onPause={handlePause}
                onSeek={handleSeek}
                onSetLoop={handleSetLoop}
                onClearLoop={handleClearLoop}
                onSetAbLoop={handleSetAbLoop}
                onClearAbLoop={handleClearAbLoop}
                loopStart={loopStart}
                loopEnd={loopEnd}
                abLoopStart={loopStart}
                abLoopEnd={loopEnd}
                title={viewState.selectedFile?.name}
              />
            </div>

            {/* Subtitle Display */}
            <div>
              <h3 className="mb-4 font-medium text-xl">Subtitles</h3>
              <SubtitleDisplay
                segments={segments}
                currentTime={audioPlayerState.currentTime}
                isPlaying={audioPlayerState.isPlaying}
                onSeek={handleSeek}
                showTranslation={true}
              />
            </div>
          </div>
        );

      case 'terminology':
        return (
          <div className="space-y-6">
            <h2 className="mb-6 font-semibold text-2xl">Terminology Glossary</h2>
            <TerminologyGlossary
              terms={terms}
              onAddTerm={addTerm}
              onUpdateTerm={updateTerm}
              onDeleteTerm={deleteTerm}
            />
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="mb-6 font-semibold text-2xl">Data Management</h2>
            <ExportImport />
          </div>
        );

      default:
        return <div>Unknown view</div>;
    }
  }, [
    viewState.currentView,
    viewState.selectedFile,
    handleFilesSelected,
    fileUploadState.isUploading,
    fileUploadState.uploadProgress,
    files,
    transcripts,
    transcriptionProgress,
    handlePlayFile,
    handleDeleteFile,
    isLoading,
    audioUrl,
    audioPlayerState.currentTime,
    audioPlayerState.isPlaying,
    handlePlay,
    handlePause,
    handleSeek,
    handleSetLoop,
    handleClearLoop,
    loopStart,
    loopEnd,
    segments,
    terms,
    addTerm,
    updateTerm,
    deleteTerm,
    handleSetAbLoop,
    handleClearAbLoop,
  ]);

  const handleViewChange = useCallback(
    (view: 'files' | 'terminology' | 'upload' | 'player' | 'settings') => {
      updateViewState({ currentView: view });
    },
    [updateViewState]
  );

  return (
    <Layout currentView={viewState.currentView} onViewChange={handleViewChange}>
      <div className="min-h-screen">{renderCurrentView}</div>
    </Layout>
  );
}
