import { LyricLine } from '../types/music';

/**
 * Formats seconds into mm:ss display
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats seconds into mm:ss.xx display (ideal for LRC sync)
 */
export function formatTimeMs(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00.00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hundredths = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
}

/**
 * Parses timestamp string [mm:ss.xx] or mm:ss into seconds
 */
export function parseTimestamp(timeStr: string): number {
  const clean = timeStr.replace(/[\[\]]/g, '').trim();
  const parts = clean.split(':');
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]);
    const secs = parseFloat(parts[1]);
    if (!isNaN(mins) && !isNaN(secs)) {
      return mins * 60 + secs;
    }
  }
  return 0;
}

/**
 * Parses raw LRC string into structured LyricLine[]
 */
export function parseLRC(lrcText: string): LyricLine[] {
  if (!lrcText || !lrcText.trim()) return [];

  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]/g;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Check for ID tags like [ti:...], [ar:...], ignore for lines
    if (/^\[(ti|ar|al|by|offset|length):/i.test(trimmed)) {
      return;
    }

    // Extract all timestamps in the line (handles multi-timestamp lines)
    const timestamps: number[] = [];
    let match: RegExpExecArray | null;
    let text = trimmed;

    while ((match = timeRegex.exec(trimmed)) !== null) {
      const mins = parseInt(match[1], 10);
      const secs = parseFloat(match[2]);
      timestamps.push(mins * 60 + secs);
    }

    // Strip timestamps to get clean text
    text = trimmed.replace(timeRegex, '').trim();

    if (timestamps.length > 0) {
      timestamps.forEach((time) => {
        result.push({
          id: `line-${index}-${time.toFixed(2)}`,
          time,
          text: text || '♪',
        });
      });
    } else if (text) {
      // Line without timestamp (plain lyric line)
      result.push({
        id: `plain-${index}`,
        time: -1,
        text,
      });
    }
  });

  // Sort by timestamp
  return result.sort((a, b) => a.time - b.time);
}

/**
 * Converts LyricLine[] into standard LRC string
 */
export function formatToLRC(lines: LyricLine[], metadata?: { title?: string; artist?: string }): string {
  const header: string[] = [];
  if (metadata?.title) header.push(`[ti:${metadata.title}]`);
  if (metadata?.artist) header.push(`[ar:${metadata.artist}]`);
  header.push('[by:BC Africa Music]');

  const body = lines
    .filter((l) => l.time >= 0)
    .sort((a, b) => a.time - b.time)
    .map((line) => `[${formatTimeMs(line.time)}] ${line.text}`);

  return [...header, ...body].join('\n');
}

/**
 * Converts raw plain text lyrics into empty-timestamped lines ready for live syncing
 */
export function plainTextToLines(text: string): LyricLine[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((text, idx) => ({
      id: `sync-line-${Date.now()}-${idx}`,
      time: -1,
      text,
    }));
}
