import {
  cn,
  createWebVttBlobUrl,
  formatDuration,
  formatFileSize,
  formatTimeForVtt,
  generateWebVttFromSegments,
} from '../../../src/lib/utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toBe('base active');
  });

  it('should handle false conditional classes', () => {
    const isActive = false;
    const result = cn('base', isActive && 'active');
    expect(result).toBe('base');
  });

  it('should merge Tailwind classes correctly', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('should handle array inputs', () => {
    const result = cn(['class1', 'class2']);
    expect(result).toBe('class1 class2');
  });

  it('should handle object inputs', () => {
    const result = cn({
      class1: true,
      class2: false,
      class3: true,
    });
    expect(result).toBe('class1 class3');
  });

  it('should handle mixed inputs', () => {
    const result = cn(
      'base',
      ['array-class'],
      { 'object-class': true },
      false && 'conditional-class'
    );
    expect(result).toBe('base array-class object-class');
  });

  it('should handle undefined and null inputs', () => {
    const result = cn('base', undefined, null, 'valid');
    expect(result).toBe('base valid');
  });

  it('should return empty string for no inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });
});

describe('formatFileSize', () => {
  it('should handle 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('should format bytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  it('should handle decimal values correctly', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1500000)).toBe('1.43 MB');
  });
});

describe('formatDuration', () => {
  it('should format seconds correctly', () => {
    expect(formatDuration(30)).toBe('30s');
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(120)).toBe('2m');
    expect(formatDuration(125)).toBe('2m 5s');
  });
});

describe('formatTimeForVtt', () => {
  it('should format time in WebVTT format', () => {
    expect(formatTimeForVtt(0)).toBe('00:00:00.000');
    expect(formatTimeForVtt(3661.5)).toBe('01:01:01.500');
    expect(formatTimeForVtt(30.123)).toBe('00:00:30.123');
  });
});

describe('generateWebVttFromSegments', () => {
  it('should return empty string for empty segments', () => {
    expect(generateWebVttFromSegments([])).toBe('');
    expect(generateWebVttFromSegments(null as any)).toBe('');
  });

  it('should generate WebVTT content correctly', () => {
    const segments = [
      { start: 0, end: 5, text: 'Hello' },
      { start: 5, end: 10, text: 'World' },
    ];

    const result = generateWebVttFromSegments(segments);
    expect(result).toContain('WEBVTT');
    expect(result).toContain('1\n00:00:00.000 --> 00:00:05.000\nHello');
    expect(result).toContain('2\n00:00:05.000 --> 00:00:10.000\nWorld');
  });
});

describe('createWebVttBlobUrl', () => {
  it('should return empty string for empty content', () => {
    expect(createWebVttBlobUrl('')).toBe('');
  });

  it('should create Blob URL for WebVTT content', () => {
    const vttContent = 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:05.000\nHello';
    const result = createWebVttBlobUrl(vttContent);

    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
