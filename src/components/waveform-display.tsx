"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  generateWaveform,
  generateWaveformForFile,
  type WaveformData,
} from "@/lib/waveform-generator";

interface WaveformDisplayProps {
  audioBlob?: Blob;
  audioUrl?: string;
  fileId?: number;
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
  height?: number;
  width?: string | number;
  color?: string;
  progressColor?: string;
  showProgress?: boolean;
  className?: string;
}

export default function WaveformDisplay({
  audioBlob,
  audioUrl,
  fileId,
  currentTime = 0,
  duration = 0,
  onSeek,
  height = 80,
  width = "100%",
  color = "#3b82f6",
  progressColor = "#10b981",
  showProgress = true,
  className = "",
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWaveform = useCallback(async () => {
    if (!audioBlob && !audioUrl && !fileId) return;

    setIsLoading(true);
    setError(null);

    try {
      let data: WaveformData;

      if (audioBlob) {
        data = await generateWaveform(audioBlob, {
          resolution: 200,
          smoothing: true,
          smoothingWindow: 3,
        });
      } else if (audioUrl) {
        // Fetch the audio from URL and convert to blob
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        data = await generateWaveform(blob, {
          resolution: 200,
          smoothing: true,
          smoothingWindow: 3,
        });
      } else if (fileId) {
        data = await generateWaveformForFile(fileId, {
          resolution: 200,
          smoothing: true,
          smoothingWindow: 3,
        });
      } else {
        throw new Error("No audio source provided");
      }

      setWaveformData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate waveform");
    } finally {
      setIsLoading(false);
    }
  }, [audioBlob, audioUrl, fileId]);

  useEffect(() => {
    loadWaveform();
  }, [loadWaveform]);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { peaks, duration: waveformDuration } = waveformData;
    const effectiveDuration = duration || waveformDuration;
    const progressRatio = effectiveDuration > 0 ? currentTime / effectiveDuration : 0;
    const progressIndex = Math.floor(progressRatio * peaks.length);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerY = canvas.height / 2;
    const barWidth = canvas.width / peaks.length;

    // Draw waveform
    peaks.forEach((peak, index) => {
      const barHeight = peak * centerY;
      const x = index * barWidth;

      const isPastProgress = index <= progressIndex;
      const fillColor = isPastProgress && showProgress ? progressColor : color;

      ctx.fillStyle = fillColor;
      ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight);
    });

    // Draw progress indicator
    if (showProgress && effectiveDuration > 0) {
      const progressX = progressRatio * canvas.width;

      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, canvas.height);
      ctx.stroke();
    }
  }, [waveformData, currentTime, duration, color, progressColor, showProgress]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !waveformData || !duration) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const clickRatio = x / canvas.width;
    const seekTime = clickRatio * duration;

    onSeek(seekTime);
  };

  const handleCanvasResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const { width: containerWidth } = container.getBoundingClientRect();
    canvas.width = containerWidth;
    canvas.height = height;

    drawWaveform();
  }, [height, drawWaveform]);

  useEffect(() => {
    handleCanvasResize();
    window.addEventListener("resize", handleCanvasResize);

    return () => {
      window.removeEventListener("resize", handleCanvasResize);
    };
  }, [handleCanvasResize]);

  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center text-muted-foreground">
          <p>Failed to load waveform</p>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full cursor-pointer rounded border"
          style={{
            height: `${height}px`,
            width: width,
          }}
        />

        {waveformData && (
          <div className="absolute top-2 right-2 rounded bg-background/80 px-2 py-1 text-muted-foreground text-xs">
            {Math.round(currentTime)}s / {Math.round(duration || waveformData.duration)}s
          </div>
        )}
      </div>
    </Card>
  );
}
