import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Pause,
  Mic2,
  FileText,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Filter,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { Track, TrackStatus } from '../types/music';

export const ReviewQueueView: React.FC = () => {
  const { tracks, currentTrack, isPlaying, playTrack, togglePlay, openLyricsStudio, updateTrackStatus } = useAudio();
  const { user, isReviewer, isAdmin, isSuperAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [rejectModalTrack, setRejectModalTrack] = useState<Track | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group tracks by review status
  const pendingTracks = tracks.filter((t) => t.status === 'pending_review');
  const approvedTracks = tracks.filter((t) => !t.status || t.status === 'approved');
  const rejectedTracks = tracks.filter((t) => t.status === 'rejected');

  const displayedTracks =
    activeTab === 'pending'
      ? pendingTracks
      : activeTab === 'approved'
      ? approvedTracks
      : activeTab === 'rejected'
      ? rejectedTracks
      : tracks;

  const handleApprove = async (track: Track) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateTrackStatus(track.id, 'approved', 'Approved by BC Africa Music Review Team');
    } catch (e) {
      console.error('Approval failed:', e);
      alert('Failed to update status. Check permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalTrack || !user) return;
    setIsSubmitting(true);
    try {
      await updateTrackStatus(
        rejectModalTrack.id,
        'rejected',
        rejectFeedback.trim() || 'Track does not meet audio quality or lyrics accuracy requirements.'
      );
      setRejectModalTrack(null);
      setRejectFeedback('');
    } catch (e) {
      console.error('Rejection failed:', e);
      alert('Failed to reject track. Check permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Editorial & Review Team Header Banner */}
      <div className="bg-gradient-to-r from-[#09182d] via-[#071324] to-[#040914] border border-sky-900/60 p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-sky-950 border border-sky-800 text-sky-300">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                Music Review & Quality Team
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {pendingTracks.length} Awaiting Inspection
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Submission Review Queue
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              The <strong>Music Review Team</strong> evaluates creator track submissions before they go live on BC Africa.
              Listen to the audio, inspect lyrics alignment, and approve or request revisions.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#0c1c33] border border-amber-500/30 px-4 py-3 rounded-2xl text-center min-w-[90px]">
              <span className="block text-2xl font-black text-amber-400">{pendingTracks.length}</span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Pending</span>
            </div>
            <div className="bg-[#0c1c33] border border-emerald-500/30 px-4 py-3 rounded-2xl text-center min-w-[90px]">
              <span className="block text-2xl font-black text-emerald-400">{approvedTracks.length}</span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Approved</span>
            </div>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-sky-950/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review ({pendingTracks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approved Catalog ({approvedTracks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rejected'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected / Revision ({rejectedTracks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>All Uploads ({tracks.length})</span>
          </button>
        </div>
      </div>

      {/* Review Queue Track Cards */}
      {displayedTracks.length === 0 ? (
        <div className="bg-[#071324] border border-sky-950 rounded-3xl p-16 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-sky-950 flex items-center justify-center text-sky-400 mx-auto mb-4 border border-sky-800">
            <CheckCircle className="w-7 h-7 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Queue is clear!</h3>
          <p className="text-xs text-slate-400">
            {activeTab === 'pending'
              ? 'No submissions are waiting for review right now.'
              : 'No tracks found matching this status filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedTracks.map((track) => {
            const isThisPlaying = currentTrack?.id === track.id && isPlaying;
            const status = track.status || 'approved';

            return (
              <div
                key={track.id}
                className="bg-[#081528] border border-sky-950/90 hover:border-sky-800/80 rounded-2xl p-4 md:p-5 transition-all shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Cover & Song Details */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-sky-950 shrink-0 border border-sky-900/60 group">
                    <img
                      src={track.coverUrl || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=80'}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => (isThisPlaying ? togglePlay() : playTrack(track))}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {isThisPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white" />}
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white truncate max-w-md">{track.title}</h4>
                      {/* Status Chip */}
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
                          status === 'pending_review'
                            ? 'bg-amber-950/70 text-amber-300 border-amber-800/80'
                            : status === 'approved'
                            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80'
                            : 'bg-rose-950/70 text-rose-300 border-rose-800/80'
                        }`}
                      >
                        {status === 'pending_review'
                          ? '⏳ Pending Review'
                          : status === 'approved'
                          ? '✓ Live & Approved'
                          : '✕ Needs Revision'}
                      </span>
                    </div>

                    <p className="text-xs text-sky-400 mt-0.5 font-medium">
                      {track.artist} <span className="text-slate-500 font-normal">• {track.album}</span>
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 flex-wrap">
                      <span className="bg-sky-950/60 px-2 py-0.5 rounded border border-sky-900/40 text-slate-300">
                        {track.genre}
                      </span>
                      <span>Uploader: {track.ownerName || track.ownerEmail || 'Artist'}</span>
                      {track.lyricsSynced && track.lyricsSynced.length > 0 ? (
                        <span className="text-emerald-400 font-mono flex items-center gap-1">
                          <Mic2 className="w-3 h-3" /> Synced ({track.lyricsSynced.length} lines)
                        </span>
                      ) : track.lyricsRaw ? (
                        <span className="text-sky-300 font-mono flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Raw Lyrics Attached
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono">No Lyrics</span>
                      )}
                    </div>

                    {/* Reviewer Feedback Notes if rejected */}
                    {track.reviewerNotes && (
                      <div className="mt-2 text-xs bg-rose-950/40 border border-rose-900/60 p-2.5 rounded-xl text-rose-200">
                        <span className="font-bold text-rose-400 block mb-0.5">Reviewer Notes:</span>
                        {track.reviewerNotes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Reviewer Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => (isThisPlaying ? togglePlay() : playTrack(track))}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-950 border border-sky-800 text-sky-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {isThisPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isThisPlaying ? 'Pause' : 'Preview'}</span>
                  </button>

                  <button
                    onClick={() => openLyricsStudio(track.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-950/50 border border-sky-900 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                    title="Open in Lyrics Sync Studio"
                  >
                    <Mic2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Sync Studio</span>
                  </button>

                  {/* Approve / Reject Controls */}
                  {status !== 'approved' && (
                    <button
                      onClick={() => handleApprove(track)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve Song</span>
                    </button>
                  )}

                  {status !== 'rejected' && (
                    <button
                      onClick={() => setRejectModalTrack(track)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Feedback Modal */}
      {rejectModalTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#081528] border border-rose-900/80 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span>Review Feedback for Artist</span>
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Specify what the artist needs to fix before this track can be approved (e.g., audio levels, sync accuracy, tags).
            </p>

            <textarea
              rows={4}
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              placeholder="e.g., Vocals clip slightly around 01:20. Please align the synchronized lyrics timestamps in Sync Studio."
              className="w-full bg-[#050c17] border border-sky-900/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
            />

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectModalTrack(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all cursor-pointer"
              >
                Submit Rejection & Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
