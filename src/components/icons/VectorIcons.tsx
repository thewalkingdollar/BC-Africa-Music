import React from 'react';

/**
 * High-Precision Vector SVG Icons & Emblems for BC Africa Music.
 * Replaces all raster images and emojis with scalable, crisp vector graphics.
 */

// 1. Official BC Africa Music Logo Emblem (African Continent with Equalizer Soundwaves)
export const BCAfricaLogo: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 40,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <defs>
      <linearGradient id="bcAfricaGrad" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#0ea5e9" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="bcWaveGrad" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="50%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <filter id="bcGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Background Circle Halo */}
    <rect width="100" height="100" rx="24" fill="#040d1a" stroke="rgba(14,165,233,0.3)" strokeWidth="1.5" />

    {/* Stylized Silhouette of African Continent */}
    <path
      d="M32 24 C38 21, 56 22, 64 27 C72 32, 74 38, 70 44 C66 48, 68 53, 64 61 C60 69, 53 77, 49 82 C46 80, 43 75, 43 68 C41 62, 33 55, 30 50 C26 44, 25 35, 32 24 Z"
      fill="url(#bcAfricaGrad)"
      opacity="0.22"
    />

    {/* Dynamic Sound Equalizer Waveforms piercing the continent */}
    {/* Bar 1 */}
    <rect x="26" y="44" width="4" height="14" rx="2" fill="url(#bcWaveGrad)" />
    {/* Bar 2 */}
    <rect x="34" y="36" width="4.5" height="30" rx="2.25" fill="#38bdf8" />
    {/* Bar 3 (Center High Bar) */}
    <rect x="43" y="26" width="5" height="48" rx="2.5" fill="#0ea5e9" filter="url(#bcGlow)" />
    {/* Bar 4 */}
    <rect x="52" y="32" width="4.5" height="38" rx="2.25" fill="#38bdf8" />
    {/* Bar 5 */}
    <rect x="61" y="40" width="4" height="22" rx="2" fill="url(#bcWaveGrad)" />
    {/* Bar 6 */}
    <rect x="69" y="46" width="3.5" height="10" rx="1.75" fill="#0284c7" />

    {/* Electric Pulsing Needle / Apex Dot */}
    <circle cx="45.5" cy="23" r="3" fill="#f59e0b" filter="url(#bcGlow)" />

    {/* Subtle Inner Ring */}
    <circle cx="50" cy="50" r="44" stroke="rgba(56,189,248,0.2)" strokeWidth="1" strokeDasharray="4 3" />
  </svg>
);

// 2. Zambia Flag Vector Badge
export const ZambiaFlagVector: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 20,
}) => (
  <svg
    width={size}
    height={(size * 2) / 3}
    viewBox="0 0 36 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block rounded-[3px] overflow-hidden shadow-sm shrink-0 ${className}`}
  >
    {/* Emerald Field */}
    <rect width="36" height="24" fill="#198a00" />

    {/* Right Stripe Block */}
    <g transform="translate(24, 8)">
      {/* Red Stripe */}
      <rect x="0" y="0" width="4" height="16" fill="#de2010" />
      {/* Black Stripe */}
      <rect x="4" y="0" width="4" height="16" fill="#000000" />
      {/* Orange Stripe */}
      <rect x="8" y="0" width="4" height="16" fill="#ef7d00" />
    </g>

    {/* Zambian Fish Eagle in Flight (Stylized Copper Orange) */}
    <path
      d="M26 4 C27 2.5, 29 2.5, 30 4 C31 5, 33 4, 34 5 C32 5.5, 30.5 7, 30 6.5 C29.5 7, 28 5.5, 26 4 Z"
      fill="#ef7d00"
    />
  </svg>
);

// 3. Nigeria Flag Vector Badge
export const NigeriaFlagVector: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 20,
}) => (
  <svg
    width={size}
    height={(size * 2) / 3}
    viewBox="0 0 36 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block rounded-[3px] overflow-hidden shadow-sm shrink-0 ${className}`}
  >
    <rect width="12" height="24" fill="#008751" />
    <rect x="12" width="12" height="24" fill="#ffffff" />
    <rect x="24" width="12" height="24" fill="#008751" />
  </svg>
);

// 4. South Africa Flag Vector Badge
export const SouthAfricaFlagVector: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 20,
}) => (
  <svg
    width={size}
    height={(size * 2) / 3}
    viewBox="0 0 36 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block rounded-[3px] overflow-hidden shadow-sm shrink-0 ${className}`}
  >
    <rect width="36" height="12" fill="#e03c31" />
    <rect y="12" width="36" height="12" fill="#001489" />
    <path d="M0 0 L15 12 L0 24 Z" fill="#000000" />
    <path d="M0 0 L18 12 L0 24" stroke="#ffb81c" strokeWidth="2.5" />
    <path d="M0 8 L13 8 L20 12 L36 12" stroke="#ffffff" strokeWidth="4" />
    <path d="M0 16 L13 16 L20 12 L36 12" stroke="#ffffff" strokeWidth="4" />
    <path d="M0 10 L14 10 L20 12 L36 12" stroke="#007749" strokeWidth="3" />
    <path d="M0 14 L14 14 L20 12 L36 12" stroke="#007749" strokeWidth="3" />
  </svg>
);

// 5. Kenya Flag Vector Badge
export const KenyaFlagVector: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 20,
}) => (
  <svg
    width={size}
    height={(size * 2) / 3}
    viewBox="0 0 36 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block rounded-[3px] overflow-hidden shadow-sm shrink-0 ${className}`}
  >
    <rect width="36" height="7" fill="#000000" />
    <rect y="7" width="36" height="1.5" fill="#ffffff" />
    <rect y="8.5" width="36" height="7" fill="#bb0000" />
    <rect y="15.5" width="36" height="1.5" fill="#ffffff" />
    <rect y="17" width="36" height="7" fill="#006600" />
    <ellipse cx="18" cy="12" rx="3.5" ry="7" fill="#bb0000" stroke="#ffffff" strokeWidth="0.8" />
  </svg>
);

// 6. Ghana Flag Vector Badge
export const GhanaFlagVector: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 20,
}) => (
  <svg
    width={size}
    height={(size * 2) / 3}
    viewBox="0 0 36 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block rounded-[3px] overflow-hidden shadow-sm shrink-0 ${className}`}
  >
    <rect width="36" height="8" fill="#cf0921" />
    <rect y="8" width="36" height="8" fill="#fcd20e" />
    <rect y="16" width="36" height="8" fill="#006b3f" />
    {/* Black Star */}
    <polygon
      points="18,9 19.5,13.5 24,13.5 20.5,16 22,20.5 18,17.5 14,20.5 15.5,16 12,13.5 16.5,13.5"
      fill="#000000"
    />
  </svg>
);

// 7. Pan-African Globe Vector Icon
export const AfricaGlobeVector: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 20,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
    <path
      d="M10 4 C13 5, 16 6, 17 9 C18 11, 16 13, 14 15 C13 17, 12 19, 11 20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M7 8 C8 9, 10 9, 10 11 C10 13, 8 14, 7 16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// 8. MTN Mobile Money Vector Icon
export const MtnMomoVector: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 22,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 rounded-lg overflow-hidden ${className}`}
  >
    <rect width="32" height="32" rx="8" fill="#ffcc00" />
    <ellipse cx="16" cy="16" rx="12" ry="7.5" fill="#003366" />
    <text x="16" y="19" textAnchor="middle" fill="#ffcc00" fontSize="9" fontWeight="900" fontFamily="sans-serif">
      MTN
    </text>
  </svg>
);

// 9. Airtel Money Vector Icon
export const AirtelMoneyVector: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 22,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 rounded-lg overflow-hidden ${className}`}
  >
    <rect width="32" height="32" rx="8" fill="#e60000" />
    <circle cx="16" cy="16" r="10" fill="#ffffff" />
    <path d="M12 19 C12 13, 20 13, 20 19 M16 11 L16 19" stroke="#e60000" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 10. Zamtel Kwacha Vector Icon
export const ZamtelVector: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 22,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 rounded-lg overflow-hidden ${className}`}
  >
    <rect width="32" height="32" rx="8" fill="#007a3d" />
    <text x="16" y="21" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="sans-serif">
      Z
    </text>
  </svg>
);

// 11. Zanaco Bank Vector Icon
export const ZanacoVector: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 22,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 rounded-lg overflow-hidden ${className}`}
  >
    <rect width="32" height="32" rx="8" fill="#e85c0d" />
    <path d="M8 24 L16 8 L24 24 Z" fill="#ffffff" />
    <path d="M12 21 L16 13 L20 21 Z" fill="#e85c0d" />
  </svg>
);

// 12. Standard Chartered Bank Vector Icon
export const StandardCharteredVector: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 22,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 rounded-lg overflow-hidden ${className}`}
  >
    <rect width="32" height="32" rx="8" fill="#004b87" />
    <path d="M10 16 C10 11, 15 11, 15 16 C15 21, 22 21, 22 16" stroke="#00a3e0" strokeWidth="3" strokeLinecap="round" />
    <path d="M13 16 C13 13, 17 13, 17 16 C17 19, 21 19, 21 16" stroke="#78be20" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 13. Stanbic Bank Vector Icon
export const StanbicVector: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 22,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 rounded-lg overflow-hidden ${className}`}
  >
    <rect width="32" height="32" rx="8" fill="#0033a0" />
    <path d="M16 7 L24 11 L24 18 C24 23, 16 26, 16 26 C16 26, 8 23, 8 18 L8 11 Z" fill="#0072ce" />
    <circle cx="16" cy="16" r="3.5" fill="#ffffff" />
  </svg>
);

// 14. FNB Bank Vector Icon
export const FnbVector: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 22,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 rounded-lg overflow-hidden ${className}`}
  >
    <rect width="32" height="32" rx="8" fill="#008080" />
    <circle cx="16" cy="16" r="10" fill="#f58220" />
    {/* Acacia Tree Silhouette */}
    <path d="M16 22 L16 16 M13 15 C10 12, 22 12, 19 15 M11 13 C9 11, 23 11, 21 13" stroke="#003333" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 15. Bank Wire / SWIFT Vector Icon
export const BankWireVector: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 22,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 rounded-lg overflow-hidden ${className}`}
  >
    <rect width="32" height="32" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
    <path d="M6 12 L16 7 L26 12 L26 14 L6 14 Z M8 16 L10 23 M14 16 L16 23 M20 16 L22 23 M6 24 L26 24" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 16. PayPal Vector Icon
export const PaypalVector: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 22,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 rounded-lg overflow-hidden ${className}`}
  >
    <rect width="32" height="32" rx="8" fill="#003087" />
    <path d="M12 9 L17 9 C19 9, 21 10.5, 20.5 13 C20 15, 18.5 16.5, 16.5 16.5 L14 16.5 L12 24" stroke="#0079c1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 13 L19 13 C21 13, 22.5 14.5, 22 17 C21.5 19, 20 20.5, 18 20.5 L16 20.5 L15 25" stroke="#00457c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 17. Lossless HD Audio Vector Badge (24-bit / 48kHz Master)
export const LosslessAudioVector: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950/80 border border-sky-400/40 text-[9px] font-mono font-bold text-sky-300 tracking-wider uppercase shadow-[0_0_8px_rgba(14,165,233,0.25)] ${className}`}>
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="6" r="5" stroke="#38bdf8" strokeWidth="1.2" />
      <polygon points="4.5,3.5 8.5,6 4.5,8.5" fill="#38bdf8" />
    </svg>
    <span>LOSSLESS HD</span>
  </div>
);

// 18. Animated Equalizer Waveform Vector Bars
export const EqualizerWaveVector: React.FC<{ isPlaying?: boolean; className?: string }> = ({
  isPlaying = false,
  className = '',
}) => (
  <div className={`flex items-end gap-0.75 h-4 ${className}`}>
    <span
      className={`w-0.75 bg-sky-400 rounded-full transition-all duration-300 ${
        isPlaying ? 'animate-pulse h-3.5' : 'h-1.5 opacity-60'
      }`}
    />
    <span
      className={`w-0.75 bg-sky-400 rounded-full transition-all duration-200 ${
        isPlaying ? 'h-4 animate-bounce' : 'h-2.5 opacity-60'
      }`}
    />
    <span
      className={`w-0.75 bg-sky-300 rounded-full transition-all duration-300 ${
        isPlaying ? 'h-2 animate-pulse' : 'h-1 opacity-60'
      }`}
    />
    <span
      className={`w-0.75 bg-sky-400 rounded-full transition-all duration-150 ${
        isPlaying ? 'h-3.5 animate-bounce' : 'h-2 opacity-60'
      }`}
    />
  </div>
);

// 19. Helper to dynamically render Country Vector Badge
export const getCountryFlagVector = (countryName?: string, size = 18): React.ReactNode => {
  if (!countryName) return <AfricaGlobeVector size={size} />;
  const lower = countryName.toLowerCase();
  if (lower.includes('zambia')) return <ZambiaFlagVector size={size} />;
  if (lower.includes('nigeria')) return <NigeriaFlagVector size={size} />;
  if (lower.includes('south africa')) return <SouthAfricaFlagVector size={size} />;
  if (lower.includes('kenya')) return <KenyaFlagVector size={size} />;
  if (lower.includes('ghana')) return <GhanaFlagVector size={size} />;
  return <AfricaGlobeVector size={size} />;
};

