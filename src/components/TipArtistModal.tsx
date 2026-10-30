import React, { useState } from 'react';
import { Heart, DollarSign, X, CheckCircle, Sparkles, MessageSquare, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';

interface TipArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: string;
  artistName: string;
  trackId?: string;
  trackTitle?: string;
  onTipSuccess?: (amount: number) => void;
}

const PRESET_AMOUNTS = [2, 5, 10, 25, 50];

export const TipArtistModal: React.FC<TipArtistModalProps> = ({
  isOpen,
  onClose,
  artistId,
  artistName,
  trackId,
  trackTitle,
  onTipSuccess,
}) => {
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [senderName, setSenderName] = useState<string>(
    user?.displayName || 'BC Music Fan'
  );
  const [message, setMessage] = useState<string>('Keep inspiring the world with authentic African sound! 🔥');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const currentTipAmount = isCustom ? parseFloat(customAmount) || 0 : selectedAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTipAmount <= 0) return;

    setIsSubmitting(true);
    const tipId = `tip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = Date.now();

    const tipData: Record<string, any> = {
      id: tipId,
      artistId: artistId || 'featured_artist',
      amount: currentTipAmount,
      currency: 'USD',
      senderName: senderName.trim() || 'Anonymous Fan',
      createdAt: new Date(now).toISOString(),
      timestamp: now,
    };

    if (trackId) tipData.trackId = trackId;
    if (user?.email) tipData.senderEmail = user.email;
    if (message.trim()) tipData.message = message.trim().slice(0, 500);

    try {
      await apiClient.tips.create(tipData);
      setIsSuccess(true);
      if (onTipSuccess) onTipSuccess(currentTipAmount);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting tip:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#0b192c] to-[#070e17] border border-sky-500/30 rounded-2xl shadow-[0_0_50px_rgba(2,132,199,0.25)] p-6 overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-sky-500/20 blur-3xl pointer-events-none rounded-full" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-sky-950/60 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Tip Sent Directly to {artistName}!</h3>
            <p className="text-sm text-slate-300 max-w-xs">
              Thank you for supporting authentic African artistry. Your ${currentTipAmount.toFixed(2)} contribution has been credited to the artist's real-time earnings.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold mb-2">
                <Heart className="w-3.5 h-3.5 fill-sky-400" />
                Direct-to-Artist Patronage
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Support {artistName}</h2>
              <p className="text-xs text-slate-300 mt-1">
                {trackTitle ? (
                  <>Tipping for <span className="text-sky-300 font-medium">"{trackTitle}"</span>. </>
                ) : null}
                100% of fan patronage goes directly into the artist's verified payout balance on the self-hosted Ubuntu server.
              </p>
            </div>

            {/* Amount Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select Tip Amount (USD)
              </label>
              <div className="grid grid-cols-5 gap-2 mb-2">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amt);
                      setIsCustom(false);
                    }}
                    className={`py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                      !isCustom && selectedAmount === amt
                        ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(2,132,199,0.5)] border border-sky-300'
                        : 'bg-slate-800/80 text-slate-300 border border-slate-700/80 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustom(true)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isCustom
                      ? 'border-sky-400 text-sky-300 bg-sky-500/10'
                      : 'border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Custom Amount
                </button>
                {isCustom && (
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      step="1"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full pl-7 pr-3 py-1.5 bg-slate-900 border border-sky-500/40 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-400"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Supporter Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Your Name / Fan Handle
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                maxLength={80}
                required
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500"
                placeholder="e.g. Kwame from Lusaka"
              />
            </div>

            {/* Supporter Message */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Fan Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={300}
                rows={2}
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500 resize-none"
                placeholder="Send love and positive energy to the creator..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || currentTipAmount <= 0}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(2,132,199,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Processing Tip...' : `Send $${currentTipAmount.toFixed(2)} Tip to ${artistName}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
