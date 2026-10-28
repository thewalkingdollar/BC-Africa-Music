import React, { useState } from 'react';
import { X, Mic2, Headphones, ShieldCheck, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/music';

const AFRICAN_COUNTRIES = [
  'Nigeria',
  'South Africa',
  'Ghana',
  'Kenya',
  'Tanzania',
  'Senegal',
  'Ivory Coast',
  'Uganda',
  'Rwanda',
  'Cameroon',
  'Zimbabwe',
  'Angola',
  'Democratic Republic of the Congo',
  'Ethiopia',
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
      <div className="relative w-full max-w-md bg-[#081322] border border-sky-950/80 rounded-2xl shadow-2xl p-6 text-slate-100 my-8 animate-in fade-in duration-200">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-sky-950/50 p-1 border border-sky-500/40 mx-auto mb-3 shadow-[0_0_20px_rgba(2,132,199,0.3)]">
            <img
              src="/assets/aistudio/e8cdafe3a5e2c0c1-blue-africa-logo_3aeaa8bc.jpg"
              alt="BC Africa Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {authModalMode === 'signup' ? 'Join BC Africa Music' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-sky-400/80 mt-0.5">
            {authModalMode === 'signup'
              ? 'Create your account and select your platform role'
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

        {/* Google OAuth Quick Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-[#0c1829] hover:bg-[#102038] border border-sky-900/60 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-3 transition-colors mb-4 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-sky-950" />
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
            or with email
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
                Choose Account Role *
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Creator / Artist Role */}
                <div
                  onClick={() => setSelectedRole('creator')}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    selectedRole === 'creator'
                      ? 'border-sky-400 bg-sky-950/60 shadow-[0_0_15px_rgba(2,132,199,0.3)]'
                      : 'border-sky-950 bg-[#050b14] opacity-70 hover:opacity-100 hover:border-sky-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Mic2 className="w-5 h-5 text-sky-400" />
                    {selectedRole === 'creator' && (
                      <Check className="w-4 h-4 text-sky-300" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white">Artist / Creator</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                    Upload your songs, stream, &amp; live sync lyrics.
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
                  <div className="flex items-center justify-between mb-1.5">
                    <Headphones className="w-5 h-5 text-sky-400" />
                    {selectedRole === 'listener' && (
                      <Check className="w-4 h-4 text-sky-300" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white">Listener / Fan</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                    Stream music, sing with karaoke lyrics, &amp; favorite tracks.
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
            className="w-full py-2.5 px-4 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(2,132,199,0.4)] transition-all cursor-pointer disabled:opacity-50 mt-4 text-xs"
          >
            {loading
              ? 'Processing...'
              : authModalMode === 'signup'
              ? 'Complete Account Setup'
              : 'Sign In to BC Africa'}
          </button>
        </form>

        {/* Footer info */}
        <p className="text-[10px] text-slate-500 text-center mt-4 leading-relaxed">
          Platform administrator role is automatically reserved for authorized team members.
        </p>
      </div>
    </div>
  );
};
