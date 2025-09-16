import { Segment } from '@/types/database';

export interface Subtitle {
  id: number;
  start: number;
  end: number;
  text: string;
  normalizedText?: string;
  translation?: string;
  annotations?: string[];
  furigana?: string;
  wordTimestamps?: import('@/types/database').WordTimestamp[];
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

export class SubtitleSynchronizer {
  private subtitles: Subtitle[] = [];
  private currentTime: number = 0;
  private options: Required<SubtitleSyncOptions>;
  private updateCallback: ((state: SubtitleState) => void) | null = null;

  constructor(
    segments: Segment[],
    options: SubtitleSyncOptions = {}
  ) {
    this.options = {
      preloadTime: options.preloadTime ?? 1.0,
      postloadTime: options.postloadTime ?? 0.5,
      syncThreshold: options.syncThreshold ?? 0.1,
      maxSubtitles: options.maxSubtitles ?? 5,
    };

    this.initializeSubtitles(segments);
  }

  private initializeSubtitles(segments: Segment[]) {
    this.subtitles = segments
      .filter(segment => segment.text && segment.start !== undefined && segment.end !== undefined)
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

  updateTime(currentTime: number) {
    this.currentTime = currentTime;
    this.updateActiveSubtitles();
  }

  private updateActiveSubtitles() {
    const activeSubtitles = this.findActiveSubtitles();
    
    this.subtitles.forEach(subtitle => {
      subtitle.isActive = activeSubtitles.some(active => active.id === subtitle.id);
    });

    this.notifyUpdate();
  }

  private findActiveSubtitles(): Subtitle[] {
    return this.subtitles.filter(subtitle => 
      this.isSubtitleActive(subtitle, this.currentTime)
    );
  }

  private isSubtitleActive(subtitle: Subtitle, currentTime: number): boolean {
    const adjustedStart = subtitle.start - this.options.preloadTime;
    const adjustedEnd = subtitle.end + this.options.postloadTime;
    
    return currentTime >= adjustedStart && currentTime <= adjustedEnd;
  }

  getCurrentState(): SubtitleState {
    const currentSubtitle = this.subtitles.find(subtitle => 
      this.currentTime >= subtitle.start && this.currentTime <= subtitle.end
    ) || null;

    const upcomingSubtitles = this.subtitles
      .filter(subtitle => subtitle.start > this.currentTime)
      .slice(0, this.options.maxSubtitles);

    const previousSubtitles = this.subtitles
      .filter(subtitle => subtitle.end < this.currentTime)
      .slice(-this.options.maxSubtitles);

    return {
      currentSubtitle,
      upcomingSubtitles,
      previousSubtitles,
      allSubtitles: this.subtitles,
    };
  }

  seekToSubtitle(subtitleId: number): number | null {
    const subtitle = this.subtitles.find(s => s.id === subtitleId);
    if (!subtitle) return null;

    return subtitle.start;
  }

  findSubtitleAtTime(time: number): Subtitle | null {
    return this.subtitles.find(subtitle => 
      time >= subtitle.start && time <= subtitle.end
    ) || null;
  }

  findNearestSubtitle(time: number): Subtitle | null {
    if (this.subtitles.length === 0) return null;

    let nearestSubtitle: Subtitle | null = null;
    let minDistance = Infinity;

    for (const subtitle of this.subtitles) {
      const subtitleMiddle = (subtitle.start + subtitle.end) / 2;
      const distance = Math.abs(time - subtitleMiddle);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestSubtitle = subtitle;
      }
    }

    return nearestSubtitle;
  }

  getSubtitleTextAtTime(time: number): string {
    const subtitle = this.findSubtitleAtTime(time);
    return subtitle?.text || '';
  }

  getSubtitlesInRange(startTime: number, endTime: number): Subtitle[] {
    return this.subtitles.filter(subtitle => 
      subtitle.end >= startTime && subtitle.start <= endTime
    );
  }

  getDuration(): number {
    if (this.subtitles.length === 0) return 0;
    
    const lastSubtitle = this.subtitles[this.subtitles.length - 1];
    return lastSubtitle.end;
  }

  getSubtitleCount(): number {
    return this.subtitles.length;
  }

  onUpdate(callback: (state: SubtitleState) => void) {
    this.updateCallback = callback;
  }

  private notifyUpdate() {
    if (this.updateCallback) {
      this.updateCallback(this.getCurrentState());
    }
  }

  destroy() {
    this.updateCallback = null;
    this.subtitles = [];
  }
}

export class SubtitleRenderer {
  static renderSubtitle(subtitle: Subtitle, showTranslation: boolean = false): string {
    if (!subtitle) return '';

    let renderedText = subtitle.normalizedText || subtitle.text;

    if (showTranslation && subtitle.translation) {
      renderedText += `\n<small class="text-gray-600">${subtitle.translation}</small>`;
    }

    if (subtitle.furigana) {
      renderedText = this.addFurigana(renderedText, subtitle.furigana);
    }

    return renderedText;
  }

  private static addFurigana(text: string, _furigana: string): string {
    // TODO: Implement furigana rendering
    return text;
  }

  static createSubtitleElement(subtitle: Subtitle, isActive: boolean = false): HTMLElement {
    const div = document.createElement('div');
    div.className = `subtitle ${isActive ? 'subtitle-active' : 'subtitle-inactive'}`;
    
    div.innerHTML = this.renderSubtitle(subtitle, true);
    
    div.setAttribute('data-start', subtitle.start.toString());
    div.setAttribute('data-end', subtitle.end.toString());
    div.setAttribute('data-id', subtitle.id.toString());

    return div;
  }
}

export class ABLoopManager {
  private startTime: number = 0;
  private endTime: number = 0;
  private isLooping: boolean = false;
  private loopCallback: ((time: number) => void) | null = null;

  setLoop(startTime: number, endTime: number) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.isLooping = true;
  }

  clearLoop() {
    this.isLooping = false;
    this.startTime = 0;
    this.endTime = 0;
  }

  checkLoop(currentTime: number): boolean {
    if (!this.isLooping || this.endTime <= this.startTime) {
      return false;
    }

    if (currentTime >= this.endTime) {
      if (this.loopCallback) {
        this.loopCallback(this.startTime);
      }
      return true;
    }

    return false;
  }

  onLoop(callback: (time: number) => void) {
    this.loopCallback = callback;
  }

  getLoopRange(): { start: number; end: number } {
    return { start: this.startTime, end: this.endTime };
  }

  isActive(): boolean {
    return this.isLooping;
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export function parseTime(timeString: string): number {
  const parts = timeString.split(':');
  
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