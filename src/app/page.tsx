"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Layout from "@/components/layout";
import FileUpload from "@/components/file-upload";
import FileList from "@/components/file-list";
import AudioPlayer from "@/components/audio-player";
import SubtitleDisplay from "@/components/subtitle-display";
import ExportImport from "@/components/export-import";
import TerminologyGlossary from "@/components/terminology-glossary";
import { FileRow, TranscriptRow, Segment, Term } from "@/types/database";
import {
  ViewState,
  FileUploadState,
  AudioPlayerState,
} from "@/components/types";
import { FileUploadUtils } from "@/lib/file-upload";
import { TranscriptionService } from "@/lib/transcription-service";
import { DBUtils } from "@/lib/db";
import { ErrorHandler } from "@/lib/error-handler";

export default function Home() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptRow[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [viewState, setViewState] = useState<ViewState>({
    currentView: "upload",
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

  // Load files and terms from database on component mount
  useEffect(() => {
    loadFiles();
    loadTerms();
  }, []);

  // Clean up audio URL on component unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Poll for transcription progress updates
  useEffect(() => {
    const interval = setInterval(async () => {
      if (files.length === 0) return;

      // Only poll files that have transcripts in processing state
      const filesToPoll = files.filter(file => {
        if (!file.id) return false;
        // Check if this file has any processing transcripts
        const fileTranscripts = transcripts.filter(t => t.fileId === file.id);
        return fileTranscripts.some(t => t.status === 'processing');
      });

      if (filesToPoll.length === 0) return;

      for (const file of filesToPoll) {
        if (!file.id) continue;

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
          ErrorHandler.handleSilently(error, "progress-polling");
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [files, transcripts]);

  // Handle loop playback
  useEffect(() => {
    if (
      loopStart !== undefined &&
      loopEnd !== undefined &&
      audioPlayerState.isPlaying &&
      audioPlayerState.currentTime >= loopEnd
    ) {
      handleSeek(loopStart);
    }
  }, [
    audioPlayerState.currentTime,
    audioPlayerState.isPlaying,
    loopStart,
    loopEnd,
  ]);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const loadedFiles = await FileUploadUtils.getAllFiles();
      setFiles(loadedFiles);
    } catch (error) {
      ErrorHandler.handleAndShowError(error, "loadFiles");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTerms = async () => {
    try {
      const loadedTerms = await DBUtils.getAllTerms();
      setTerms(loadedTerms);
    } catch (error) {
      ErrorHandler.handleAndShowError(error, "loadTerms");
    }
  };

  const handleAddTerm = async (termData: Omit<Term, 'id'>) => {
    try {
      await DBUtils.addTerm(termData);
      await loadTerms();
      toast.success("Term added successfully");
    } catch (error) {
      ErrorHandler.handleAndShowError(error, "addTerm");
    }
  };

  const handleUpdateTerm = async (term: Term) => {
    try {
      if (!term.id) throw new Error("Term ID is required for update");
      await DBUtils.updateTerm(term.id, term);
      await loadTerms();
      toast.success("Term updated successfully");
    } catch (error) {
      ErrorHandler.handleAndShowError(error, "updateTerm");
    }
  };

  const handleDeleteTerm = async (id: number) => {
    try {
      await DBUtils.deleteTerm(id);
      await loadTerms();
      toast.success("Term deleted successfully");
    } catch (error) {
      ErrorHandler.handleAndShowError(error, "deleteTerm");
    }
  };

  const handleViewChange = (view: ViewState["currentView"]) => {
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
          console.log(`File uploaded with ID: ${fileId}`);

          // Update progress after each successful upload
          setFileUploadState((prev) => ({
            ...prev,
            uploadProgress: Math.round(((index + 1) / selectedFiles.length) * 100),
          }));

          // Start transcription process (fire and forget)
          TranscriptionService.transcribeAudio(fileId, {
            language: "ja",
            onProgress: (progress) => {
              console.log(
                `Transcription progress for file ${fileId}: ${progress.progress}%`,
              );
            },
          }).then(transcriptId => {
            console.log(
              `Transcription started for file ${fileId}, transcript ID: ${transcriptId}`,
            );
          }).catch(transcriptionError => {
            console.error(
              `Transcription failed for file ${fileId}:`,
              transcriptionError,
            );
            toast.error(`Transcription failed for ${file.name}`);
          });

          return { success: true, fileId };
        } catch (error) {
          ErrorHandler.handleAndShowError(error, "processFile", `Failed to process ${file.name}`);
          return { success: false, error, fileName: file.name };
        }
      });

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);

      // Check if any uploads failed
      const failedUploads = results.filter(result => !result.success);
      if (failedUploads.length > 0) {
        console.warn(`${failedUploads.length} file(s) failed to upload`);
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
      ErrorHandler.handleAndShowError(error, "fileUpload");
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
      currentView: "player",
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
        toast.error("File ID is missing");
        return;
      }
      const fileTranscripts = await TranscriptionService.getFileTranscripts(
        file.id,
      );
      setTranscripts(fileTranscripts);

      // If there are completed transcripts, load their segments
      const completedTranscript = fileTranscripts.find(
        (t) => t.status === "completed",
      );
      if (completedTranscript) {
        if (!completedTranscript.id) {
          toast.error("Transcript ID is missing");
          return;
        }
        const { segments: loadedSegments } =
          await DBUtils.getTranscriptWithSegments(completedTranscript.id);
        setSegments(loadedSegments);
      } else {
        // No completed transcript, use empty segments
        setSegments([]);
      }
    } catch (error) {
      ErrorHandler.handleAndShowError(error, "loadFileData");
      setSegments([]);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      await FileUploadUtils.deleteFile(fileId);
      // Reload files to reflect the deletion
      await loadFiles();
    } catch (error) {
      ErrorHandler.handleAndShowError(error, "deleteFile");
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
      case "upload":
        return (
          <div className="space-y-6">
            <FileUpload
              onFilesSelected={handleFilesSelected}
              isUploading={fileUploadState.isUploading}
              uploadProgress={fileUploadState.uploadProgress}
            />
          </div>
        );

      case "files":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-6">Your Files</h2>
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

      case "player":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                {viewState.selectedFile?.name || "Audio Player"}
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
              <h3 className="text-xl font-medium mb-4">Subtitles</h3>
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

      case "settings":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-6">Settings</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-medium mb-4">Data Management</h3>
                <ExportImport onDataImported={loadFiles} />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">
                  Application Information
                </h3>
                <p className="text-muted-foreground">
                  Version: 1.0.0 | PWA Enabled
                </p>
              </div>
            </div>
          </div>
        );

      case "terminology":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-6">Terminology Glossary</h2>
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
