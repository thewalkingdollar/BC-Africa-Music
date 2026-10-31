import React, { useState } from 'react';
import { X, Mic2, Headphones, ShieldCheck, Sparkles, Check, AlertCircle, Edit3 } from 'lucide-react';
import { useAuth, BOOTSTRAP_ADMIN_EMAIL } from '../context/AuthContext';
import { UserRole } from '../types/music';
import { BCAfricaLogo } from './icons/VectorIcons';

export const AFRICAN_COUNTRIES = [
  'Zambia',
  'Nigeria',
  'South Africa',
  'Ghana',
  'Kenya',
  'Tanzania',
  'Zimbabwe',
  'Senegal',
  'Ivory Coast',
  'Uganda',
  'Rwanda',
  'Cameroon',
  'Angola',
  'Democratic Republic of the Congo',
  'Ethiopia',
  'Namibia',
  'Botswana',
  'Malawi',
  'Mozambique',
  'United Kingdom (Diaspora)',
  'United States (Diaspora)',
  'Canada (Diaspora)',
  'Other African Nation / Diaspora',
];

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('creator');
  const [stageName, setStageName] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authModalMode === 'signup') {
        if (!displayName.trim()) throw new Error('Please enter your name');
        if (!email.trim()) throw new Error('Please enter your email');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');

        await signUpWithEmail(
          email,
          password,
          displayName,
          selectedRole,
          selectedRole === 'creator' ? stageName || displayName : undefined,
          country
        );
      } else {
        if (!email.trim() || !password) throw new Error('Please enter email and password');
        await signInWithEmail(email, password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      if (msg.includes('email-already-in-use')) {
        setError('This email is already registered. Please sign in instead.');
      } else if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Invalid email or password.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign in failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#081322] border border-sky-950/80 rounded-2xl shadow-2xl p-6 text-slate-100 my-8 animate-in fade-in duration-200">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <BCAfricaLogo size={48} />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {authModalMode === 'signup' ? 'Join BC Africa Music' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-sky-400/80 mt-0.5">
            {authModalMode === 'signup'
              ? 'Select your platform team and account role'
              : 'Sign in to access your library, uploads, and synced tracks'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex bg-[#050b14] p-1 rounded-xl border border-sky-950 mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('signup');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              authModalMode === 'signup'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              authModalMode === 'login'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Self-Hosted Super Admin Quick Access */}
        <div className="mb-4 p-2.5 rounded-xl bg-gradient-to-r from-sky-950/70 to-indigo-950/70 border border-sky-500/30 flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-[10px] font-bold text-sky-300 uppercase tracking-widest block">
              100% Self-Hosted Server Auth
            </span>
            <span className="text-[11px] text-slate-300 block">
              Super Admin: <code className="text-sky-400 font-mono">bcafricao@gmail.com</code>
            </span>
          </div>
          <button
            type="button"
            onClick={async () => {
              setError(null);
              setLoading(true);
              try {
                await signInWithEmail(BOOTSTRAP_ADMIN_EMAIL, 'admin123');
              } catch (err: unknown) {
                // If password differs, set inputs
                setEmail(BOOTSTRAP_ADMIN_EMAIL);
                setPassword('admin123');
                setAuthModalMode('login');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-[11px] font-bold shadow-md transition-colors cursor-pointer shrink-0"
          >
            Sign In As Admin
          </button>
        </div>

        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-sky-950" />
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
            {authModalMode === 'signup' ? 'fill details below' : 'enter credentials'}
          </span>
          <div className="flex-1 h-px bg-sky-950" />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalMode === 'signup' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Your Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Samuel Adekunle"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#050b14] border border-sky-900/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="you@bcafrica.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#050b14] border border-sky-900/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#050b14] border border-sky-900/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* Account Role Selection during Sign Up */}
          {authModalMode === 'signup' && (
            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Choose Account Role & Team *
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Creator / Artist Role */}
                <div
                  onClick={() => setSelectedRole('creator')}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    selectedRole === 'creator'
                      ? 'border-sky-400 bg-sky-950/60 shadow-[0_0_15px_rgba(2,132,199,0.3)]'
                      : 'border-sky-950 bg-[#050b14] opacity-70 hover:opacity-100 hover:border-sky-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Mic2 className="w-4 h-4 text-sky-400" />
                    {selectedRole === 'creator' && <Check className="w-3.5 h-3.5 text-sky-300" />}
                  </div>
                  <h4 className="text-xs font-bold text-white">Artist / Creator</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                    Upload tracks to review queue & sync lyrics.
                  </p>
                </div>

                {/* Listener Role */}
                <div
                  onClick={() => setSelectedRole('listener')}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    selectedRole === 'listener'
                      ? 'border-sky-400 bg-sky-950/60 shadow-[0_0_15px_rgba(2,132,199,0.3)]'
                      : 'border-sky-950 bg-[#050b14] opacity-70 hover:opacity-100 hover:border-sky-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Headphones className="w-4 h-4 text-sky-400" />
                    {selectedRole === 'listener' && <Check className="w-3.5 h-3.5 text-sky-300" />}
                  </div>
                  <h4 className="text-xs font-bold text-white">Listener / Fan</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                    Stream music, follow lyrics, & favorite songs.
                  </p>
                </div>

                {/* Editorial Team */}
                <div
                  onClick={() => setSelectedRole('editor')}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    selectedRole === 'editor'
                      ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'border-sky-950 bg-[#050b14] opacity-70 hover:opacity-100 hover:border-sky-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                    {selectedRole === 'editor' && <Check className="w-3.5 h-3.5 text-cyan-300" />}
                  </div>
                  <h4 className="text-xs font-bold text-white">Editorial Team</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                    Curate metadata, correct lyrics & sync timestamps.
                  </p>
                </div>

                {/* Music Review Team */}
                <div
                  onClick={() => setSelectedRole('reviewer')}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    selectedRole === 'reviewer'
                      ? 'border-emerald-400 bg-emerald-950/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'border-sky-950 bg-[#050b14] opacity-70 hover:opacity-100 hover:border-sky-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    {selectedRole === 'reviewer' && <Check className="w-3.5 h-3.5 text-emerald-300" />}
                  </div>
                  <h4 className="text-xs font-bold text-white">Review Team</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                    Audit & approve music before it gets published.
                  </p>
                </div>
              </div>

              {/* Creator Additional Details */}
              {selectedRole === 'creator' && (
                <div className="mt-3 space-y-3 p-3 bg-sky-950/30 rounded-xl border border-sky-900/50">
                  <div>
                    <label className="block text-[10px] font-semibold text-sky-300 uppercase tracking-wider mb-1">
                      Artist / Stage Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Burna Boy, Ayra Starr, or your stage handle"
                      value={stageName}
                      onChange={(e) => setStageName(e.target.value)}
                      className="w-full bg-[#050b14] border border-sky-900/60 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-sky-300 uppercase tracking-wider mb-1">
                      Country / Region
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-[#050b14] border border-sky-900/60 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400"
                    >
                      {AFRICAN_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(2,132,199,0.4)] transition-all cursor-pointer disabled:opacity-50 mt-4"
          >
            {loading
              ? 'Processing...'
              : authModalMode === 'signup'
              ? 'Create Account & Continue'
              : 'Sign In to BC Africa'}
          </button>
        </form>
      </div>
    </div>
  );
};
