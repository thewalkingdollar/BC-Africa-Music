import React from 'react';
import { Volume2, ExternalLink, SkipForward, Sparkles, ShieldCheck } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

export const AdPlayerOverlay: React.FC = () => {
  const { isAdOverlayOpen, adTimeRemaining, canSkipAd, activeAdData, dismissAd } = usePlatform();

  if (!isAdOverlayOpen || !activeAdData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#081322] border border-sky-500/40 rounded-3xl shadow-[0_0_50px_rgba(2,132,199,0.35)] overflow-hidden text-slate-100 p-6 md:p-8">
        {/* Glowing Top Ambient Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-600 animate-pulse" />

        {/* Header Tag */}
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800 text-sky-400 text-xs font-semibold">
            <Volume2 className="w-3.5 h-3.5 animate-bounce" />
            <span>Sponsored Audio Break</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Verified Sponsor</span>
          </div>
        </div>

        {/* Sponsor Banner Creative */}
        {activeAdData.adBannerUrl && (
          <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-5 border border-sky-900/60 shadow-lg group">
            <img
              src={activeAdData.adBannerUrl}
              alt={activeAdData.adTitle}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#081322] via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300 drop-shadow">
                {activeAdData.sponsorName}
              </span>
            </div>
          </div>
        )}

        {/* Ad Title & Description */}
        <div className="space-y-2 mb-6">
          <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
            {activeAdData.adTitle}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {activeAdData.adDescription}
          </p>
        </div>

        {/* Live Audio Visualizer Wave Effect for the Ad */}
        <div className="flex items-center justify-center gap-1 h-6 mb-6 px-4 bg-sky-950/40 rounded-xl border border-sky-900/50 py-1">
          <span className="text-[10px] text-sky-400/80 font-mono uppercase mr-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Audio Playing
          </span>
          {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65, 90, 40].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-sky-500 to-cyan-300 rounded-full animate-pulse"
              style={{
                height: `${h}%`,
                animationDelay: `${(i * 0.1).toFixed(1)}s`,
                animationDuration: '0.8s',
              }}
            />
          ))}
        </div>

        {/* Action Controls & Skip Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-sky-950">
          {activeAdData.adLinkUrl ? (
            <a
              href={activeAdData.adLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white transition-all cursor-pointer"
            >
              <span>{activeAdData.adCtaText || 'Visit Sponsor'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <div />
          )}

          {/* Countdown & Skip Button */}
          {canSkipAd ? (
            <button
              onClick={dismissAd}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-xs font-bold text-white shadow-[0_0_20px_rgba(2,132,199,0.4)] transition-all cursor-pointer animate-in zoom-in-95 duration-150"
            >
              <span>Skip Ad & Resume</span>
              <SkipForward className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-950/80 border border-sky-900 text-slate-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Skip in {adTimeRemaining}s...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
