import React, { useEffect, useRef, useState } from 'react';
import { X, Sliders, Download, Copy, Check, Sparkles, Music } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { formatToLRC } from '../utils/lrcParser';

export const LyricsViewer: React.FC = () => {
  const {
    currentTrack,
    currentTime,
    seek,
    isLyricsOpen,
    setIsLyricsOpen,
    openLyricsStudio,
  } = useAudio();

  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'synced' | 'plain'>('synced');
  const [copied, setCopied] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  const syncedLines = currentTrack?.lyricsSynced || [];
  const hasSyncedLyrics = syncedLines.length > 0 && syncedLines.some((l) => l.time >= 0);

  // Find active line based on current playback time
  useEffect(() => {
    if (!hasSyncedLyrics) {
      setActiveLineId(null);
      return;
    }

    // Find the latest line whose time <= currentTime
    let currentId: string | null = null;
    for (let i = syncedLines.length - 1; i >= 0; i--) {
      if (syncedLines[i].time <= currentTime + 0.15) {
        currentId = syncedLines[i].id;
        break;
      }
    }
    setActiveLineId(currentId || syncedLines[0]?.id || null);
  }, [currentTime, syncedLines, hasSyncedLyrics]);

  // Smooth auto-scroll to keep active line centered
  useEffect(() => {
    if (viewMode === 'synced' && activeLineRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const element = activeLineRef.current;

      const containerHeight = container.clientHeight;
      const elementTop = element.offsetTop;
      const elementHeight = element.clientHeight;

      container.scrollTo({
        top: elementTop - containerHeight / 2 + elementHeight / 2,
        behavior: 'smooth',
      });
    }
  }, [activeLineId, viewMode]);

  if (!isLyricsOpen || !currentTrack) return null;

  const handleCopyLrc = () => {
    const lrc = formatToLRC(syncedLines, {
      title: currentTrack.title,
      artist: currentTrack.artist,
    });
    navigator.clipboard.writeText(lrc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLrc = () => {
    const lrc = formatToLRC(syncedLines, {
      title: currentTrack.title,
      artist: currentTrack.artist,
    });
    const blob = new Blob([lrc], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentTrack.artist} - ${currentTrack.title}.lrc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-45 w-full sm:w-[420px] lg:w-[480px] bg-[#08121f]/98 backdrop-blur-2xl border-l border-sky-950/80 shadow-[-20px_0_40px_rgba(0,0,0,0.6)] flex flex-col pt-16 pb-24 transition-all animate-in slide-in-from-right duration-300">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-sky-950/60">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">Live Lyrics</h3>
          {hasSyncedLyrics && (
            <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded-full border border-sky-800 font-mono">
              Karaoke Sync
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Toggle between Synced and Plain mode */}
          {hasSyncedLyrics && (
            <div className="flex items-center bg-[#050b14] p-0.5 rounded-lg border border-sky-900/40 text-[11px]">
              <button
                onClick={() => setViewMode('synced')}
                className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                  viewMode === 'synced' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Synced
              </button>
              <button
                onClick={() => setViewMode('plain')}
                className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                  viewMode === 'plain' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Plain
              </button>
            </div>
          )}

          {/* Sync Studio link */}
          <button
            onClick={() => {
              openLyricsStudio(currentTrack.id);
              setIsLyricsOpen(false);
            }}
            className="p-1.5 text-slate-400 hover:text-sky-300 rounded hover:bg-sky-950/60 transition-colors cursor-pointer"
            title="Open Sync Studio to adjust timings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={() => setIsLyricsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Track summary */}
      <div className="px-6 py-3 bg-sky-950/20 border-b border-sky-950/40 flex items-center justify-between">
        <div className="truncate pr-4">
          <p className="text-xs font-semibold text-white truncate">{currentTrack.title}</p>
          <p className="text-[11px] text-sky-300/80 truncate">{currentTrack.artist}</p>
        </div>

        {hasSyncedLyrics && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyLrc}
              className="p-1.5 text-slate-400 hover:text-sky-300 text-xs rounded transition-colors"
              title="Copy .LRC to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleDownloadLrc}
              className="p-1.5 text-slate-400 hover:text-sky-300 text-xs rounded transition-colors"
              title="Download .LRC file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Lyrics Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scroll-smooth select-none"
      >
        {!hasSyncedLyrics && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-full bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-sky-400 mb-3">
              <Music className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">No synced lyrics available</h4>
            <p className="text-xs text-slate-400 max-w-xs mb-5">
              Sync lyrics line-by-line while listening using the BC Africa Live Sync Studio.
            </p>
            <button
              onClick={() => {
                openLyricsStudio(currentTrack.id);
                setIsLyricsOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-[0_0_15px_rgba(2,132,199,0.3)] transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Launch Sync Studio</span>
            </button>
          </div>
        )}

        {hasSyncedLyrics && viewMode === 'synced' && (
          <div className="space-y-4 py-12">
            {syncedLines.map((line) => {
              const isActive = activeLineId === line.id;
              const isPast = activeLineId ? syncedLines.findIndex((l) => l.id === activeLineId) > syncedLines.findIndex((l) => l.id === line.id) : false;

              return (
                <div
                  key={line.id}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => {
                    if (line.time >= 0) seek(line.time);
                  }}
                  className={`cursor-pointer transition-all duration-300 transform origin-left py-1.5 px-3 rounded-lg ${
                    isActive
                      ? 'text-white text-lg sm:text-xl font-bold bg-sky-950/40 border-l-2 border-sky-400 lyric-glow scale-[1.02]'
                      : isPast
                      ? 'text-slate-400 text-sm hover:text-slate-200'
                      : 'text-slate-500 text-sm hover:text-slate-300'
                  }`}
                >
                  <p className="leading-relaxed tracking-tight">{line.text}</p>
                </div>
              );
            })}
          </div>
        )}

        {hasSyncedLyrics && viewMode === 'plain' && (
          <div className="space-y-3 py-4 font-normal text-sm text-slate-300 leading-relaxed">
            {syncedLines.map((line) => (
              <p key={line.id} className="hover:text-white transition-colors">
                {line.text}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Footer prompt */}
      <div className="px-6 py-3 border-t border-sky-950/60 bg-[#060c15] text-[11px] text-slate-400 flex items-center justify-between">
        <span>Click any lyric line to jump directly to it</span>
        <button
          onClick={() => {
            openLyricsStudio(currentTrack.id);
            setIsLyricsOpen(false);
          }}
          className="text-sky-400 hover:text-sky-300 font-medium underline"
        >
          Edit Timings
        </button>
      </div>
    </aside>
  );
};
