"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import EnhancedSubtitleDisplay from "@/components/enhanced-subtitle-display";
import type { Segment } from "@/types/database";

// 示例字幕数据
const demoSegments: Segment[] = [
  {
    id: 1,
    transcriptId: 1,
    start: 0,
    end: 3,
    text: "こんにちは",
    normalizedText: "こんにちは",
    translation: "你好",
    furigana: "こんにちは|こんにちわ",
    annotations: ["konnichiwa"],
    wordTimestamps: [
      { word: "こんにちは", start: 0, end: 3, confidence: 0.95 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    transcriptId: 1,
    start: 3,
    end: 6,
    text: "世界",
    normalizedText: "世界",
    translation: "世界",
    furigana: "世界|せかい",
    annotations: ["sekai"],
    wordTimestamps: [
      { word: "世界", start: 3, end: 6, confidence: 0.92 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    transcriptId: 1,
    start: 6,
    end: 10,
    text: "日本語を勉強しています",
    normalizedText: "日本語を勉強しています",
    translation: "我正在学习日语",
    furigana: "日本語|にほんご 勉強|べんきょう して|して います|います",
    annotations: ["nihongo o benkyou shite imasu"],
    wordTimestamps: [
      { word: "日本語", start: 6, end: 7.5, confidence: 0.94 },
      { word: "を", start: 7.5, end: 8, confidence: 0.89 },
      { word: "勉強", start: 8, end: 9, confidence: 0.91 },
      { word: "して", start: 9, end: 9.5, confidence: 0.88 },
      { word: "います", start: 9.5, end: 10, confidence: 0.90 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const EnhancedSubtitleDemo = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState([1.0]);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showRomaji, setShowRomaji] = useState(true);
  const [showFurigana, setShowFurigana] = useState(true);

  // 模拟音频播放
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1 * playbackSpeed[0];
          // 循环播放
          if (newTime >= 10) {
            setIsPlaying(false);
            return 0;
          }
          return newTime;
        });
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const navigateToPrevious = () => {
    const previousSegment = demoSegments
      .filter(segment => segment.end < currentTime)
      .pop();
    if (previousSegment) {
      setCurrentTime(previousSegment.start);
    }
  };

  const navigateToNext = () => {
    const nextSegment = demoSegments
      .filter(segment => segment.start > currentTime)
      .shift();
    if (nextSegment) {
      setCurrentTime(nextSegment.start);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            增强字幕显示演示
          </h1>
          <p className="text-gray-600">
            支持假名标记、罗马音标注和翻译的日语学习字幕显示
          </p>
        </div>

        {/* 控制面板 */}
        <Card className="p-6">
          <div className="space-y-4">
            {/* 播放控制 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigateToPrevious}
                  disabled={currentTime <= 0}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button onClick={togglePlay} size="sm">
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigateToNext}
                  disabled={currentTime >= 10}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                <span className="text-sm font-mono">
                  {formatTime(currentTime)} / 0:10
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">播放速度</span>
                  <Slider
                    value={playbackSpeed}
                    onValueChange={setPlaybackSpeed}
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="w-24"
                  />
                  <span className="text-sm font-mono">{playbackSpeed[0]}x</span>
                </div>
              </div>
            </div>

            {/* 时间轴 */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                onValueChange={([value]) => setCurrentTime(value)}
                min={0}
                max={10}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0:00</span>
                <span>0:05</span>
                <span>0:10</span>
              </div>
            </div>

            {/* 显示选项 */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showTranslation}
                    onChange={(e) => setShowTranslation(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">显示翻译</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showRomaji}
                    onChange={(e) => setShowRomaji(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">显示罗马音</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showFurigana}
                    onChange={(e) => setShowFurigana(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">显示假名</span>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* 字幕显示 */}
        <EnhancedSubtitleDisplay
          segments={demoSegments}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onSeek={handleSeek}
          showTranslation={showTranslation}
          showRomaji={showRomaji}
          showFurigana={showFurigana}
        />

        {/* 说明 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">功能说明</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">假名标记</h3>
              <p className="text-gray-600">
                汉字上方显示对应的平假名或片假名读音，帮助学习者正确发音。
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">罗马音标注</h3>
              <p className="text-gray-600">
                在汉字假名下方显示罗马音，方便不熟悉日语假名的学习者。
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">翻译字幕</h3>
              <p className="text-gray-600">
                在底部显示中文翻译，帮助理解句子的含义。
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">字符级高亮</h3>
              <p className="text-gray-600">
                根据播放进度精确高亮当前正在发音的字符，提供更好的学习体验。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedSubtitleDemo;
