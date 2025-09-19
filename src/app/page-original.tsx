'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import AudioPlayer from '@/components/audio-player';
import ExportImport from '@/components/export-import';
import FileList from '@/components/file-list';
import FileUpload from '@/components/file-upload';
import Layout from '@/components/layout';
import SubtitleDisplay from '@/components/subtitle-display';
import TerminologyGlossary from '@/components/terminology-glossary';
import type { AudioPlayerState, FileUploadState, ViewState } from '@/components/types';
import { DbUtils } from '@/lib/db';
import { handleAndShowError, handleSilently } from '@/lib/error-handler';
import { FileUploadUtils } from '@/lib/file-upload';
import { TranscriptionService } from '@/lib/transcription-service';
import type { FileRow, Segment, Term, TranscriptRow } from '@/types/database';

export default function Home() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptRow[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [viewState, setViewState] = useState<ViewState>({
    currentView: 'upload',
    isPlaying: false,
    currentTime: 0,
  });
  const [fileUploadState, setFileUploadState] = useState<FileUploadState>({
    selectedFiles: [],
    isUploading: false,
    uploadProgress: 0,
  });
  const [audioPlayerState, setAudioPlayerState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState<
    Map<number, { progress: number; status: string }>
  >(new Map());
  const [loopStart, setLoopStart] = useState<number>();
  const [loopEnd, setLoopEnd] = useState<number>();
  const [audioUrl, setAudioUrl] = useState<string>();
  const [terms, setTerms] = useState<Term[]>([]);

  const loadFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedFiles = await FileUploadUtils.getAllFiles();
      setFiles(loadedFiles);
    } catch (error) {
      handleAndShowError(error, 'loadFiles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTerms = useCallback(async () => {
    try {
      const loadedTerms = await DbUtils.getAllTerms();
      setTerms(loadedTerms);
    } catch (error) {
      handleAndShowError(error, 'loadTerms');
    }
  }, []);

  // Load files and terms from database on component mount
  useEffect(() => {
    loadFiles();
    loadTerms();
  }, [loadFiles, loadTerms]);

  // Clean up audio URL on component unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Helper function to check if a file needs polling
  const shouldPollFile = useCallback(
    (file: FileRow): boolean => {
      if (!file.id) return false;
      const fileTranscripts = transcripts.filter((t) => t.fileId === file.id);
      return fileTranscripts.some((t) => t.status === 'processing');
    },
    [transcripts]
  );

  // Helper function to poll a single file's progress
  const pollFileProgress = useCallback(async (file: FileRow) => {
    if (!file.id) return;

    try {
      const response = await fetch(`/api/progress/${file.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.progress) {
          setTranscriptionProgress((prev) => {
            const newMap = new Map(prev);
            if (file.id) {
              newMap.set(file.id, data.progress);
            }
            return newMap;
          });
        }
      }
    } catch (error) {
      handleSilently(error, 'progress-polling');
    }
  }, []);

  // Poll for transcription progress updates
  useEffect(() => {
    const interval = setInterval(async () => {
      if (files.length === 0) return;

      const filesToPoll = files.filter(shouldPollFile);
      if (filesToPoll.length === 0) return;

      // Poll all files concurrently
      await Promise.all(filesToPoll.map(pollFileProgress));
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [files, shouldPollFile, pollFileProgress]);

  // Handle loop playback
  useEffect(() => {
    if (
      loopStart !== undefined &&
      loopEnd !== undefined &&
      audioPlayerState.isPlaying &&
      audioPlayerState.currentTime >= loopEnd
    ) {
      setAudioPlayerState((prev) => ({ ...prev, currentTime: loopStart }));
    }
  }, [audioPlayerState.currentTime, audioPlayerState.isPlaying, loopStart, loopEnd]);

  const handleAddTerm = async (termData: Omit<Term, 'id'>) => {
    try {
      await DbUtils.addTerm(termData);
      await loadTerms();
      toast.success('Term added successfully');
    } catch (error) {
      handleAndShowError(error, 'addTerm');
    }
  };

  const handleUpdateTerm = async (term: Term) => {
    try {
      if (!term.id) throw new Error('Term ID is required for update');
      await DbUtils.updateTerm(term.id, term);
      await loadTerms();
      toast.success('Term updated successfully');
    } catch (error) {
      handleAndShowError(error, 'updateTerm');
    }
  };

  const handleDeleteTerm = async (id: number) => {
    try {
      await DbUtils.deleteTerm(id);
      await loadTerms();
      toast.success('Term deleted successfully');
    } catch (error) {
      handleAndShowError(error, 'deleteTerm');
    }
  };

  const handleViewChange = (view: ViewState['currentView']) => {
    setViewState((prev) => ({ ...prev, currentView: view }));
  };

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setFileUploadState((prev) => ({
      ...prev,
      selectedFiles,
      isUploading: true,
      uploadProgress: 0,
    }));

    try {
      // Process all files concurrently
      const uploadPromises = selectedFiles.map(async (file, index) => {
        try {
          // Upload file to database
          const fileId = await FileUploadUtils.uploadFile(file);

          // Update progress after each successful upload
          setFileUploadState((prev) => ({
            ...prev,
            uploadProgress: Math.round(((index + 1) / selectedFiles.length) * 100),
          }));

          // Start transcription process (fire and forget)
          TranscriptionService.transcribeAudio(fileId, {
            language: 'ja',
            onProgress: (_progress) => {
              // Progress callback - intentionally empty for now
            },
          })
            .then((_transcriptId) => {
              // Transcription completed successfully
            })
            .catch((_transcriptionError) => {
              toast.error(`Transcription failed for ${file.name}`);
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

      setFileUploadState((prev) => ({
        ...prev,
        isUploading: false,
        uploadProgress: 100,
        selectedFiles: [],
      }));
    } catch (error) {
      handleAndShowError(error, 'fileUpload');
      setFileUploadState((prev) => ({
        ...prev,
        isUploading: false,
        uploadProgress: 0,
        selectedFiles: [],
      }));
    }
  };

  const handlePlayFile = async (file: FileRow) => {
    // Clean up previous audio URL if it exists
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(undefined);
    }

    setViewState((prev) => ({
      ...prev,
      currentView: 'player',
      selectedFile: file,
    }));
    setAudioPlayerState((prev) => ({ ...prev, isPlaying: true }));

    try {
      // Create object URL for the audio file
      if (file.id) {
        const url = await FileUploadUtils.getFileUrl(file.id);
        setAudioUrl(url);
      }

      // Load transcripts for this file
      if (!file.id) {
        toast.error('File ID is missing');
        return;
      }
      const fileTranscripts = await TranscriptionService.getFileTranscripts(file.id);
      setTranscripts(fileTranscripts);

      // If there are completed transcripts, load their segments
      const completedTranscript = fileTranscripts.find((t) => t.status === 'completed');
      if (completedTranscript) {
        if (!completedTranscript.id) {
          toast.error('Transcript ID is missing');
          return;
        }
        const { segments: loadedSegments } = await DbUtils.getTranscriptWithSegments(
          completedTranscript.id
        );
        setSegments(loadedSegments);
      } else {
        // No completed transcript, use empty segments
        setSegments([]);
      }
    } catch (error) {
      handleAndShowError(error, 'loadFileData');
      setSegments([]);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      await FileUploadUtils.deleteFile(fileId);
      // Reload files to reflect the deletion
      await loadFiles();
    } catch (error) {
      handleAndShowError(error, 'deleteFile');
    }
  };

  const handlePlay = () => {
    setAudioPlayerState((prev) => ({ ...prev, isPlaying: true }));
  };

  const handlePause = () => {
    setAudioPlayerState((prev) => ({ ...prev, isPlaying: false }));
  };

  const handleSeek = (time: number) => {
    setAudioPlayerState((prev) => ({ ...prev, currentTime: time }));
  };

  const handleSetLoop = (start: number, end: number) => {
    setLoopStart(start);
    setLoopEnd(end);
  };

  const handleClearLoop = () => {
    setLoopStart(undefined);
    setLoopEnd(undefined);
  };

  const renderCurrentView = () => {
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
                loopStart={loopStart}
                loopEnd={loopEnd}
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

      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="mb-6 font-semibold text-2xl">Settings</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-4 font-medium text-xl">Data Management</h3>
                <ExportImport onDataImported={loadFiles} />
              </div>
              <div>
                <h3 className="mb-2 font-medium text-xl">Application Information</h3>
                <p className="text-muted-foreground">Version: 1.0.0 | PWA Enabled</p>
              </div>
            </div>
          </div>
        );

      case 'terminology':
        return (
          <div className="space-y-6">
            <h2 className="mb-6 font-semibold text-2xl">Terminology Glossary</h2>
            <TerminologyGlossary
              terms={terms}
              onAddTerm={handleAddTerm}
              onUpdateTerm={handleUpdateTerm}
              onDeleteTerm={handleDeleteTerm}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout currentView={viewState.currentView} onViewChange={handleViewChange}>
      {renderCurrentView()}
    </Layout>
  );
}
