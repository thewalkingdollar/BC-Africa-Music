import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Plus,
  Trash2,
  Clock,
  Check,
  Download,
  Copy,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  Save,
  Music,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { LyricLine, Track } from '../types/music';
import {
  formatTime,
  formatTimeMs,
  formatToLRC,
  parseLRC,
  plainTextToLines,
} from '../utils/lrcParser';

export const LyricsSyncStudio: React.FC = () => {
  const {
    tracks,
    currentTrack,
    playTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
    updateTrackLyrics,
    closeLyricsStudio,
  } = useAudio();

  const [selectedTrack, setSelectedTrack] = useState<Track>(currentTrack || tracks[0]);
  const [studioMode, setStudioMode] = useState<'live-sync' | 'fine-tune' | 'raw-text'>('live-sync');
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [activeSyncIndex, setActiveSyncIndex] = useState<number>(0);
  const [rawText, setRawText] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [copiedLrc, setCopiedLrc] = useState<boolean>(false);

  const linesContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync internal lines when selected track changes
  useEffect(() => {
    if (selectedTrack) {
      if (selectedTrack.lyricsSynced && selectedTrack.lyricsSynced.length > 0) {
        setLines([...selectedTrack.lyricsSynced]);
      } else if (selectedTrack.lyricsRaw) {
        setLines(parseLRC(selectedTrack.lyricsRaw));
      } else {
        setLines([]);
      }
      setRawText(selectedTrack.lyricsRaw || '');
      setActiveSyncIndex(0);
    }
  }, [selectedTrack]);

  // Keep selectedTrack in sync if currentTrack changes externally
  useEffect(() => {
    if (currentTrack && currentTrack.id !== selectedTrack?.id) {
      // Keep selected track if user deliberately picked it, else sync
    }
  }, [currentTrack, selectedTrack]);

  // Keyboard shortcut for Spacebar tap-to-sync when in live sync mode
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if typing in input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (studioMode === 'live-sync') {
          syncCurrentLine();
        } else {
          togglePlay();
        }
      }
    },
    [studioMode, activeSyncIndex, lines, currentTime]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Ensure current track is playing when user wants audio feedback
  const ensurePlaying = async () => {
    if (currentTrack?.id !== selectedTrack.id) {
      await playTrack(selectedTrack);
    } else if (!isPlaying) {
      await togglePlay();
    }
  };

  // Stamp current audio time onto the current line and advance to next
  const syncCurrentLine = () => {
    if (activeSyncIndex >= lines.length) return;

    const updated = [...lines];
    updated[activeSyncIndex] = {
      ...updated[activeSyncIndex],
      time: Math.max(0, currentTime),
    };
    setLines(updated);

    const nextIndex = Math.min(lines.length - 1, activeSyncIndex + 1);
    setActiveSyncIndex(nextIndex);

    // Auto-scroll the line list
    if (linesContainerRef.current) {
      const el = linesContainerRef.current.children[nextIndex] as HTMLElement;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const undoLastSync = () => {
    if (activeSyncIndex > 0) {
      const prevIndex = activeSyncIndex - 1;
      const updated = [...lines];
      updated[prevIndex] = { ...updated[prevIndex], time: -1 };
      setLines(updated);
      setActiveSyncIndex(prevIndex);
    }
  };

  const resetAllTimestamps = () => {
    if (confirm('Clear all timestamp markers from lyrics? Text will be preserved.')) {
      setLines((prev) => prev.map((l) => ({ ...l, time: -1 })));
      setActiveSyncIndex(0);
    }
  };

  const adjustLineTime = (index: number, delta: number) => {
    setLines((prev) => {
      const updated = [...prev];
      const newTime = Math.max(0, (updated[index].time >= 0 ? updated[index].time : currentTime) + delta);
      updated[index] = { ...updated[index], time: Number(newTime.toFixed(2)) };
      return updated;
    });
  };

  const setLineToPlayhead = (index: number) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], time: Number(currentTime.toFixed(2)) };
      return updated;
    });
  };

  const updateLineText = (index: number, newText: string) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], text: newText };
      return updated;
    });
  };

  const addLine = (afterIndex: number) => {
    const newLine: LyricLine = {
      id: `line-${Date.now()}`,
      time: -1,
      text: 'New lyric line...',
    };
    const updated = [...lines];
    updated.splice(afterIndex + 1, 0, newLine);
    setLines(updated);
  };

  const removeLine = (index: number) => {
    const updated = lines.filter((_, i) => i !== index);
    setLines(updated);
    if (activeSyncIndex >= updated.length) {
      setActiveSyncIndex(Math.max(0, updated.length - 1));
    }
  };

  // Convert raw textarea text into lines
  const handleParseRawText = () => {
    if (!rawText.trim()) return;
    const hasTimestamps = /\[\d{1,2}:\d{2}/.test(rawText);
    if (hasTimestamps) {
      setLines(parseLRC(rawText));
    } else {
      setLines(plainTextToLines(rawText));
    }
    setStudioMode('live-sync');
    setActiveSyncIndex(0);
  };

  // Save changes to track and persistence
  const handleSaveToTrack = async () => {
    const rawLrc = formatToLRC(lines, {
      title: selectedTrack.title,
      artist: selectedTrack.artist,
    });
    await updateTrackLyrics(selectedTrack.id, lines, rawLrc);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCopyLrc = () => {
    const rawLrc = formatToLRC(lines, {
      title: selectedTrack.title,
      artist: selectedTrack.artist,
    });
    navigator.clipboard.writeText(rawLrc);
    setCopiedLrc(true);
    setTimeout(() => setCopiedLrc(false), 2000);
  };

  const handleDownloadLrc = () => {
    const rawLrc = formatToLRC(lines, {
      title: selectedTrack.title,
      artist: selectedTrack.artist,
    });
    const blob = new Blob([rawLrc], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTrack.artist} - ${selectedTrack.title}.lrc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 pb-28">
      {/* Top Banner & Track Selection */}
      <div className="bg-[#0b1728] border border-sky-950/80 rounded-2xl p-6 shadow-xl mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-sky-950 border border-sky-800/60 shrink-0 shadow-md">
              <img
                src={selectedTrack.coverUrl || '/assets/aistudio/e8cdafe3a5e2c0c1-blue-africa-logo_3aeaa8bc.jpg'}
                alt={selectedTrack.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/e8cdafe3a5e2c0c1-blue-africa-logo_3aeaa8bc.jpg';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800/60 uppercase">
                  Lyrics Sync Studio
                </span>
                <span className="text-xs text-slate-400">{lines.length} lines</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight mt-1">
                {selectedTrack.title}
              </h1>
              <p className="text-xs text-slate-300">{selectedTrack.artist}</p>
            </div>
          </div>

          {/* Select Track Dropdown */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <select
                value={selectedTrack.id}
                onChange={(e) => {
                  const target = tracks.find((t) => t.id === e.target.value);
                  if (target) {
                    setSelectedTrack(target);
                    playTrack(target);
                  }
                }}
                className="appearance-none bg-[#070e17] border border-sky-900 text-xs text-white rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-sky-400 cursor-pointer"
              >
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} - {t.artist}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            <button
              onClick={handleSaveToTrack}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-[0_0_15px_rgba(2,132,199,0.4)] transition-all cursor-pointer"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Saved!' : 'Save Lyrics'}</span>
            </button>
          </div>
        </div>

        {/* Audio Transport Bar inside Studio */}
        <div className="mt-6 pt-5 border-t border-sky-950/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => seek(Math.max(0, currentTime - 5))}
              className="p-2 bg-sky-950/70 hover:bg-sky-900 border border-sky-800/40 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Rewind 5 seconds"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>-5s</span>
            </button>

            <button
              onClick={ensurePlaying}
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-semibold rounded-lg shadow-md flex items-center gap-2 cursor-pointer text-xs"
            >
              {isPlaying && currentTrack?.id === selectedTrack.id ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Play Song</span>
                </>
              )}
            </button>

            <button
              onClick={() => seek(Math.min(duration, currentTime + 5))}
              className="p-2 bg-sky-950/70 hover:bg-sky-900 border border-sky-800/40 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Fast forward 5 seconds"
            >
              <span>+5s</span>
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Big Monospace Playhead Indicator */}
          <div className="flex items-center gap-3 font-mono">
            <span className="text-xs text-slate-400 uppercase tracking-widest">Playhead:</span>
            <div className="px-3.5 py-1.5 bg-[#050b14] border border-sky-800/70 rounded-lg text-lg text-sky-300 font-bold tabular-nums shadow-inner">
              {formatTimeMs(currentTime)}
            </div>
            <span className="text-xs text-slate-400">/ {formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLrc}
              className="p-2 text-slate-300 hover:text-white bg-sky-950/50 hover:bg-sky-900 border border-sky-800/40 rounded-lg text-xs flex items-center gap-1 transition-colors"
              title="Copy formatted LRC"
            >
              {copiedLrc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">LRC</span>
            </button>
            <button
              onClick={handleDownloadLrc}
              className="p-2 text-slate-300 hover:text-white bg-sky-950/50 hover:bg-sky-900 border border-sky-800/40 rounded-lg text-xs flex items-center gap-1 transition-colors"
              title="Download .LRC file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-sky-950/80 mb-6 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStudioMode('live-sync')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              studioMode === 'live-sync'
                ? 'bg-sky-600 text-white shadow-[0_0_12px_rgba(2,132,199,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-sky-950/50'
            }`}
          >
            1. Live Tap-to-Sync
          </button>
          <button
            onClick={() => setStudioMode('fine-tune')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              studioMode === 'fine-tune'
                ? 'bg-sky-600 text-white shadow-[0_0_12px_rgba(2,132,199,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-sky-950/50'
            }`}
          >
            2. Precision Adjuster
          </button>
          <button
            onClick={() => setStudioMode('raw-text')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              studioMode === 'raw-text'
                ? 'bg-sky-600 text-white shadow-[0_0_12px_rgba(2,132,199,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-sky-950/50'
            }`}
          >
            3. Paste Lyrics / LRC
          </button>
        </div>

        {lines.length > 0 && (
          <button
            onClick={resetAllTimestamps}
            className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
          >
            Clear All Timestamps
          </button>
        )}
      </div>

      {/* Mode 1: Live Tap-to-Sync */}
      {studioMode === 'live-sync' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Tap Control Deck */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-[#0b1728] border border-sky-950/80 rounded-2xl p-6 text-center shadow-lg">
              <span className="text-[10px] font-mono text-sky-400 uppercase tracking-widest block mb-2">
                Live Recording Trigger
              </span>

              {/* Big Tap to Sync Button */}
              <button
                onClick={() => {
                  ensurePlaying();
                  syncCurrentLine();
                }}
                className="w-full py-8 px-4 bg-gradient-to-b from-sky-500 to-sky-700 hover:from-sky-400 hover:to-sky-600 active:scale-[0.98] text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(2,132,199,0.4)] transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
              >
                <Clock className="w-8 h-8 text-sky-200 group-hover:rotate-12 transition-transform" />
                <span className="text-xl md:text-2xl tracking-tight">MARK CURRENT LINE</span>
                <span className="text-xs text-sky-200 font-mono bg-sky-900/60 px-3 py-1 rounded-full border border-sky-700/60">
                  Or Press [SPACEBAR]
                </span>
              </button>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <button
                  onClick={undoLastSync}
                  disabled={activeSyncIndex === 0}
                  className="px-3 py-1.5 rounded bg-sky-950/60 border border-sky-900/60 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  Undo Last Line
                </button>
                <span>
                  Line {lines.length > 0 ? activeSyncIndex + 1 : 0} of {lines.length}
                </span>
                <button
                  onClick={() => setActiveSyncIndex((prev) => Math.min(lines.length - 1, prev + 1))}
                  disabled={activeSyncIndex >= lines.length - 1}
                  className="px-3 py-1.5 rounded bg-sky-950/60 border border-sky-900/60 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  Skip Line
                </button>
              </div>
            </div>

            {/* Instructions box */}
            <div className="bg-sky-950/30 border border-sky-900/40 rounded-xl p-4 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-1.5 text-sky-300 font-semibold">
                <HelpCircle className="w-4 h-4" />
                <span>How Live Sync Works:</span>
              </div>
              <p>1. Click <strong>Play Song</strong> to start music playback.</p>
              <p>2. Tap the big blue button or press <strong>[SPACE]</strong> the exact moment each lyric is sung.</p>
              <p>3. The line is automatically stamped with the exact audio timestamp and the pointer smoothly moves to the next line!</p>
              <p>4. Hit <strong>Save Lyrics</strong> when finished.</p>
            </div>
          </div>

          {/* Right Column: Lyric Line List */}
          <div className="lg:col-span-7 bg-[#08121f] border border-sky-950/80 rounded-2xl p-4 max-h-[580px] overflow-y-auto">
            {lines.length === 0 ? (
              <div className="text-center py-16">
                <Music className="w-8 h-8 text-sky-400 mx-auto mb-2 opacity-60" />
                <p className="text-sm text-slate-300 font-semibold">No lyrics found for this track</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">Paste plain lyrics or an LRC file to start syncing.</p>
                <button
                  onClick={() => setStudioMode('raw-text')}
                  className="px-4 py-2 text-xs bg-sky-600 text-white rounded-lg font-medium cursor-pointer"
                >
                  Paste Lyrics
                </button>
              </div>
            ) : (
              <div ref={linesContainerRef} className="space-y-2">
                {lines.map((line, idx) => {
                  const isCurrent = idx === activeSyncIndex;
                  const isStamped = line.time >= 0;

                  return (
                    <div
                      key={line.id}
                      onClick={() => setActiveSyncIndex(idx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-sky-950/80 border-sky-500 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                          : isStamped
                          ? 'bg-[#0b1728]/50 border-sky-950 text-slate-300 hover:border-sky-900'
                          : 'bg-[#070e17] border-slate-900 text-slate-500 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-[10px] font-mono text-slate-400 w-5 shrink-0">
                          {idx + 1}.
                        </span>
                        <p
                          className={`text-sm truncate font-medium ${
                            isCurrent
                              ? 'text-white font-bold'
                              : isStamped
                              ? 'text-slate-200'
                              : 'text-slate-400'
                          }`}
                        >
                          {line.text}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isStamped ? (
                          <span className="text-xs font-mono text-sky-300 bg-sky-950 px-2 py-0.5 rounded border border-sky-800/60 tabular-nums">
                            {formatTimeMs(line.time)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono italic">
                            Unsynced
                          </span>
                        )}
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Precision Adjuster & Editor */}
      {studioMode === 'fine-tune' && (
        <div className="bg-[#08121f] border border-sky-950/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Line Timings & Text Editor</h3>
            <button
              onClick={() => addLine(lines.length - 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-sky-950 border border-sky-800 text-sky-300 hover:text-white rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line at End</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {lines.map((line, idx) => (
              <div
                key={line.id}
                className="bg-[#0b1728] border border-sky-950 rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
              >
                {/* Index and Text Input */}
                <div className="flex items-center gap-2 flex-1 w-full min-w-0">
                  <span className="text-xs font-mono text-slate-400 w-6 shrink-0">{idx + 1}.</span>
                  <input
                    type="text"
                    value={line.text}
                    onChange={(e) => updateLineText(idx, e.target.value)}
                    className="flex-1 bg-[#070e17] border border-sky-900/60 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                {/* Timing controls */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Current timestamp */}
                  <div className="font-mono text-xs text-sky-300 bg-sky-950 px-2.5 py-1.5 rounded border border-sky-800/80 min-w-[70px] text-center tabular-nums">
                    {line.time >= 0 ? formatTimeMs(line.time) : '--:--.--'}
                  </div>

                  {/* Nudge -0.25s / +0.25s */}
                  <div className="flex items-center rounded border border-sky-900/60 overflow-hidden text-xs font-mono">
                    <button
                      onClick={() => adjustLineTime(idx, -0.25)}
                      className="px-2 py-1 bg-[#070e17] text-slate-300 hover:text-white hover:bg-sky-950 cursor-pointer"
                      title="Nudge 0.25s earlier"
                    >
                      -0.25s
                    </button>
                    <button
                      onClick={() => adjustLineTime(idx, 0.25)}
                      className="px-2 py-1 bg-[#070e17] text-slate-300 hover:text-white hover:bg-sky-950 border-l border-sky-900/60 cursor-pointer"
                      title="Nudge 0.25s later"
                    >
                      +0.25s
                    </button>
                  </div>

                  {/* Set to Playhead */}
                  <button
                    onClick={() => setLineToPlayhead(idx)}
                    className="px-2.5 py-1 text-xs bg-sky-950 border border-sky-800 text-sky-300 hover:text-white rounded cursor-pointer"
                    title="Set this line's timestamp to the current playing audio position"
                  >
                    Set to Playhead
                  </button>

                  {/* Jump & Play */}
                  {line.time >= 0 && (
                    <button
                      onClick={async () => {
                        await ensurePlaying();
                        seek(line.time);
                      }}
                      className="p-1.5 text-slate-300 hover:text-sky-300 cursor-pointer"
                      title="Play from this line"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Insert line */}
                  <button
                    onClick={() => addLine(idx)}
                    className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                    title="Insert line below"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  {/* Remove line */}
                  <button
                    onClick={() => removeLine(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                    title="Delete line"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode 3: Paste Plain Text or LRC */}
      {studioMode === 'raw-text' && (
        <div className="bg-[#08121f] border border-sky-950/80 rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Import Lyrics or LRC</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Paste standard lyrics (one line per verse) or formatted LRC code with [mm:ss.xx] timestamps.
            </p>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={14}
            placeholder={`Paste lyrics here, for example:

Rise with the morning light, shining bright
From the peak of Kilimanjaro in the sky
Feel the rhythm in your heart, don't let it die
BC Africa, we fly so high!

Or paste standard [mm:ss.xx] LRC formatted text.`}
            className="w-full bg-[#070e17] border border-sky-900/60 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-400 leading-relaxed"
          />

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {rawText.split('\n').filter((l) => l.trim()).length} lines detected
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setRawText('')}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
              <button
                onClick={handleParseRawText}
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-md cursor-pointer transition-all"
              >
                Convert & Start Syncing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Reminder when changes made */}
      <div className="fixed bottom-20 right-6 z-40">
        <button
          onClick={handleSaveToTrack}
          className="flex items-center gap-2 px-5 py-3 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 rounded-full shadow-[0_4px_25px_rgba(2,132,199,0.5)] transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'Changes Saved!' : 'Save All Synced Lyrics'}</span>
        </button>
      </div>
    </div>
  );
};
