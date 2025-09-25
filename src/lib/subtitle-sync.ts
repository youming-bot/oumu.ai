import type { Segment } from "@/types/database";

export interface Subtitle {
  id: number;
  start: number;
  end: number;
  text: string;
  normalizedText?: string;
  translation?: string;
  annotations?: string[];
  furigana?: string;
  wordTimestamps?: import("@/types/database").WordTimestamp[];
  isActive: boolean;
}

export interface SubtitleSyncOptions {
  preloadTime?: number;
  postloadTime?: number;
  syncThreshold?: number;
  maxSubtitles?: number;
}

export interface SubtitleState {
  currentSubtitle: Subtitle | null;
  upcomingSubtitles: Subtitle[];
  previousSubtitles: Subtitle[];
  allSubtitles: Subtitle[];
}

export interface SubtitleSynchronizerInstance {
  updateTime: (currentTime: number) => void;
  getCurrentState: () => SubtitleState;
  seekToSubtitle: (subtitleId: number) => number | null;
  findSubtitleAtTime: (time: number) => Subtitle | null;
  findNearestSubtitle: (time: number) => Subtitle | null;
  getSubtitleTextAtTime: (time: number) => string;
  getSubtitlesInRange: (startTime: number, endTime: number) => Subtitle[];
  getDuration: () => number;
  getSubtitleCount: () => number;
  onUpdate: (callback: (state: SubtitleState) => void) => void;
  destroy: () => void;
}

export interface AbLoopManagerInstance {
  setLoop: (startTime: number, endTime: number) => void;
  clearLoop: () => void;
  checkLoop: (currentTime: number) => boolean;
  onLoop: (callback: (time: number) => void) => void;
  getLoopRange: () => { start: number; end: number };
  isActive: () => boolean;
}

// 函数式实现
function createSubtitleSynchronizer(
  segments: Segment[],
  options: SubtitleSyncOptions = {},
): SubtitleSynchronizerInstance {
  let subtitles: Subtitle[] = [];
  let currentTime: number = 0;
  const resolvedOptions: Required<SubtitleSyncOptions> = {
    preloadTime: options.preloadTime ?? 1.0,
    postloadTime: options.postloadTime ?? 0.5,
    syncThreshold: options.syncThreshold ?? 0.1,
    maxSubtitles: options.maxSubtitles ?? 5,
  };
  let updateCallback: ((state: SubtitleState) => void) | null = null;

  function initializeSubtitles(segmentsToProcess: Segment[]) {
    subtitles = segmentsToProcess
      .filter((segment) => segment.text && segment.start !== undefined && segment.end !== undefined)
      .map((segment, index) => ({
        id: segment.id || index,
        start: segment.start,
        end: segment.end,
        text: segment.text,
        normalizedText: segment.normalizedText,
        translation: segment.translation,
        annotations: segment.annotations,
        furigana: segment.furigana,
        wordTimestamps: segment.wordTimestamps,
        isActive: false,
      }))
      .sort((a, b) => a.start - b.start);
  }

  function updateActiveSubtitles() {
    const activeSubtitles = findActiveSubtitles();

    subtitles.forEach((subtitle) => {
      subtitle.isActive = activeSubtitles.some((active) => active.id === subtitle.id);
    });

    notifyUpdate();
  }

  function findActiveSubtitles(): Subtitle[] {
    return subtitles.filter((subtitle) => isSubtitleActive(subtitle, currentTime));
  }

  function isSubtitleActive(subtitle: Subtitle, time: number): boolean {
    const adjustedStart = subtitle.start - resolvedOptions.preloadTime;
    const adjustedEnd = subtitle.end + resolvedOptions.postloadTime;

    return time >= adjustedStart && time <= adjustedEnd;
  }

  function notifyUpdate() {
    if (updateCallback) {
      updateCallback(getCurrentState());
    }
  }

  function updateTime(newTime: number) {
    currentTime = newTime;
    updateActiveSubtitles();
  }

  function getCurrentState(): SubtitleState {
    const currentSubtitle =
      subtitles.find((subtitle) => currentTime >= subtitle.start && currentTime <= subtitle.end) ||
      null;

    const upcomingSubtitles = subtitles
      .filter((subtitle) => subtitle.start > currentTime)
      .slice(0, resolvedOptions.maxSubtitles);

    const previousSubtitles = subtitles
      .filter((subtitle) => subtitle.end < currentTime)
      .slice(-resolvedOptions.maxSubtitles);

    return {
      currentSubtitle,
      upcomingSubtitles,
      previousSubtitles,
      allSubtitles: subtitles,
    };
  }

  function seekToSubtitle(subtitleId: number): number | null {
    const subtitle = subtitles.find((s) => s.id === subtitleId);
    if (!subtitle) return null;

    return subtitle.start;
  }

  function findSubtitleAtTime(time: number): Subtitle | null {
    return subtitles.find((subtitle) => time >= subtitle.start && time <= subtitle.end) || null;
  }

  function findNearestSubtitle(time: number): Subtitle | null {
    if (subtitles.length === 0) return null;

    let nearestSubtitle: Subtitle | null = null;
    let minDistance = Infinity;

    for (const subtitle of subtitles) {
      const subtitleMiddle = (subtitle.start + subtitle.end) / 2;
      const distance = Math.abs(time - subtitleMiddle);

      if (distance < minDistance) {
        minDistance = distance;
        nearestSubtitle = subtitle;
      }
    }

    return nearestSubtitle;
  }

  function getSubtitleTextAtTime(time: number): string {
    const subtitle = findSubtitleAtTime(time);
    return subtitle?.text || "";
  }

  function getSubtitlesInRange(startTime: number, endTime: number): Subtitle[] {
    return subtitles.filter((subtitle) => subtitle.end >= startTime && subtitle.start <= endTime);
  }

  function getDuration(): number {
    if (subtitles.length === 0) return 0;

    const lastSubtitle = subtitles[subtitles.length - 1];
    return lastSubtitle.end;
  }

  function getSubtitleCount(): number {
    return subtitles.length;
  }

  function onUpdate(callback: (state: SubtitleState) => void) {
    updateCallback = callback;
  }

  function destroy() {
    updateCallback = null;
    subtitles = [];
  }

  // Initialize
  initializeSubtitles(segments);

  return {
    updateTime,
    getCurrentState,
    seekToSubtitle,
    findSubtitleAtTime,
    findNearestSubtitle,
    getSubtitleTextAtTime,
    getSubtitlesInRange,
    getDuration,
    getSubtitleCount,
    onUpdate,
    destroy,
  };
}

// SubtitleRenderer 函数
export function renderSubtitle(subtitle: Subtitle, showTranslation: boolean = false): string {
  if (!subtitle) return "";

  let renderedText = subtitle.normalizedText || subtitle.text;

  if (showTranslation && subtitle.translation) {
    renderedText += `\n<small class="text-gray-600">${subtitle.translation}</small>`;
  }

  if (subtitle.furigana) {
    renderedText = addFurigana(renderedText, subtitle.furigana);
  }

  return renderedText;
}

function addFurigana(text: string, _furigana: string): string {
  // TODO: Implement furigana rendering
  return text;
}

export function createSubtitleElement(subtitle: Subtitle, isActive: boolean = false): HTMLElement {
  const div = document.createElement("div");
  div.className = `subtitle ${isActive ? "subtitle-active" : "subtitle-inactive"}`;

  div.innerHTML = renderSubtitle(subtitle, true);

  div.setAttribute("data-start", subtitle.start.toString());
  div.setAttribute("data-end", subtitle.end.toString());
  div.setAttribute("data-id", subtitle.id.toString());

  return div;
}

// AbLoopManager 函数
export function createAbLoopManager(): AbLoopManagerInstance {
  let startTime: number = 0;
  let endTime: number = 0;
  let isLooping: boolean = false;
  let loopCallback: ((time: number) => void) | null = null;

  function setLoop(start: number, end: number) {
    startTime = start;
    endTime = end;
    isLooping = true;
  }

  function clearLoop() {
    isLooping = false;
    startTime = 0;
    endTime = 0;
  }

  function checkLoop(currentTime: number): boolean {
    if (!isLooping || endTime <= startTime) {
      return false;
    }

    if (currentTime >= endTime) {
      if (loopCallback) {
        loopCallback(startTime);
      }
      return true;
    }

    return false;
  }

  function onLoop(callback: (time: number) => void) {
    loopCallback = callback;
  }

  function getLoopRange(): { start: number; end: number } {
    return { start: startTime, end: endTime };
  }

  function isActive(): boolean {
    return isLooping;
  }

  return {
    setLoop,
    clearLoop,
    checkLoop,
    onLoop,
    getLoopRange,
    isActive,
  };
}

// Utility functions
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);

  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

export function parseTime(timeString: string): number {
  const parts = timeString.split(":");

  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }

  return parseFloat(timeString);
}

// 向后兼容的类定义
export class SubtitleSynchronizer {
  private instance: SubtitleSynchronizerInstance;

  constructor(segments: Segment[], options: SubtitleSyncOptions = {}) {
    this.instance = createSubtitleSynchronizer(segments, options);
  }

  updateTime(currentTime: number) {
    this.instance.updateTime(currentTime);
  }

  getCurrentState(): SubtitleState {
    return this.instance.getCurrentState();
  }

  seekToSubtitle(subtitleId: number): number | null {
    return this.instance.seekToSubtitle(subtitleId);
  }

  findSubtitleAtTime(time: number): Subtitle | null {
    return this.instance.findSubtitleAtTime(time);
  }

  findNearestSubtitle(time: number): Subtitle | null {
    return this.instance.findNearestSubtitle(time);
  }

  getSubtitleTextAtTime(time: number): string {
    return this.instance.getSubtitleTextAtTime(time);
  }

  getSubtitlesInRange(startTime: number, endTime: number): Subtitle[] {
    return this.instance.getSubtitlesInRange(startTime, endTime);
  }

  getDuration(): number {
    return this.instance.getDuration();
  }

  getSubtitleCount(): number {
    return this.instance.getSubtitleCount();
  }

  onUpdate(callback: (state: SubtitleState) => void) {
    this.instance.onUpdate(callback);
  }

  destroy() {
    this.instance.destroy();
  }
}

// biome-ignore lint/complexity/noStaticOnlyClass: Backward compatibility for existing code
export class SubtitleRenderer {
  static renderSubtitle = renderSubtitle;
  static createSubtitleElement = createSubtitleElement;
}

export class AbLoopManager {
  private instance: AbLoopManagerInstance;

  constructor() {
    this.instance = createAbLoopManager();
  }

  setLoop(startTime: number, endTime: number) {
    this.instance.setLoop(startTime, endTime);
  }

  clearLoop() {
    this.instance.clearLoop();
  }

  checkLoop(currentTime: number): boolean {
    return this.instance.checkLoop(currentTime);
  }

  onLoop(callback: (time: number) => void) {
    this.instance.onLoop(callback);
  }

  getLoopRange(): { start: number; end: number } {
    return this.instance.getLoopRange();
  }

  isActive(): boolean {
    return this.instance.isActive();
  }
}
