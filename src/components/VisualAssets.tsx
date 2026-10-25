import React from 'react';
import { CommodityType } from '../types/agronomy';

export const TaniCerdasLogo: React.FC<{ className?: string; light?: boolean }> = ({
  className = 'w-9 h-9',
  light = false,
}) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle cx="32" cy="32" r="30" fill={light ? '#FFFFFF' : '#DCFCE7'} />
    {/* Left dark leaf */}
    <path
      d="M31 48C19 46 14 35 16 22C26 22 33 29 33 41L31 48Z"
      fill="#14532D"
    />
    {/* Right bright leaf */}
    <path
      d="M31 48C31 33 38 19 50 15C51 29 45 43 31 48Z"
      fill="#15803D"
    />
    {/* Leaf vein */}
    <path
      d="M31 48C34 36 40 26 47 19"
      stroke="#DCFCE7"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

export const CropThumbnailIllustration: React.FC<{
  commodity: CommodityType;
  className?: string;
}> = ({ commodity, className = 'w-16 h-16 rounded-xl' }) => {
  if (commodity === 'Jagung') {
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="cornBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#86EFAC" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="14" fill="url(#cornBg)" />
        <path d="M50 92V24" stroke="#15803D" strokeWidth="6" strokeLinecap="round" />
        <path d="M50 65C32 55 20 62 14 72C26 74 40 72 50 65Z" fill="#16A34A" />
        <path d="M50 52C68 42 80 48 86 58C74 60 60 58 50 52Z" fill="#15803D" />
        {/* Corn cob */}
        <ellipse cx="56" cy="44" rx="9" ry="16" transform="rotate(15 56 44)" fill="#F59E0B" />
        <path d="M48 56C49 44 56 36 62 32" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (commodity === 'Cabai') {
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
        <rect width="100" height="100" rx="14" fill="#DCFCE7" />
        <path d="M50 90V28" stroke="#14532D" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="35" cy="42" rx="14" ry="8" transform="rotate(-20 35 42)" fill="#15803D" />
        <ellipse cx="66" cy="38" rx="14" ry="8" transform="rotate(20 66 38)" fill="#16A34A" />
        {/* Red chilies */}
        <path d="M40 50C34 62 36 74 44 80C43 68 44 58 40 50Z" fill="#DC2626" />
        <path d="M62 46C68 58 66 70 58 76C59 64 58 54 62 46Z" fill="#EF4444" />
      </svg>
    );
  }

  // Default: Padi (Rice Field Canopy)
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="riceSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="45%" stopColor="#DCFCE7" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="14" fill="url(#riceSky)" />
      {/* Sun */}
      <circle cx="76" cy="24" r="9" fill="#FDE047" opacity="0.9" />
      {/* Rice blades */}
      <path d="M22 96C24 68 34 42 46 20" stroke="#14532D" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <path d="M36 96C38 64 48 38 62 18" stroke="#15803D" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M52 96C50 66 40 44 24 26" stroke="#16A34A" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <path d="M66 96C68 68 76 46 86 28" stroke="#14532D" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <path d="M46 96C48 70 58 50 74 34" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Golden panicle */}
      <path d="M60 20C68 22 74 28 78 36" stroke="#EAB308" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="3 3" fill="none" />
    </svg>
  );
};

/**
 * Ilustrasi Gejala Penyakit & Hama sesuai Layar 5, 6, dan 11 Papan Presentasi UI.
 */
export const SymptomLeafIllustration: React.FC<{
  visualKey: 'blas' | 'tungro' | 'wereng' | 'penggerek' | 'hawar' | 'kahat_n' | 'antraknosa';
  className?: string;
}> = ({ visualKey, className = 'w-full h-full' }) => {
  if (visualKey === 'wereng') {
    return (
      <svg viewBox="0 0 320 200" className={className} aria-label="Ilustrasi Wereng Batang Coklat pada batang padi">
        <rect width="320" height="200" fill="#14532D" />
        {/* Rice stems */}
        <path d="M90 200L110 0" stroke="#4ADE80" strokeWidth="22" />
        <path d="M160 200L170 0" stroke="#22C55E" strokeWidth="26" />
        <path d="M230 200L220 0" stroke="#16A34A" strokeWidth="20" />
        {/* Brown planthopper insects on stem */}
        {[
          { cx: 162, cy: 70 },
          { cx: 170, cy: 105 },
          { cx: 158, cy: 138 },
          { cx: 102, cy: 120 },
          { cx: 166, cy: 165 },
        ].map((bug, i) => (
          <g key={i} transform={`translate(${bug.cx}, ${bug.cy})`}>
            <ellipse cx="0" cy="0" rx="11" ry="6" fill="#92400E" stroke="#FDE68A" strokeWidth="1.5" />
            <circle cx="-8" cy="-1" r="3.5" fill="#78350F" />
            <path d="M-4 5L-7 11M2 5L0 11M7 4L9 10" stroke="#78350F" strokeWidth="1.5" />
          </g>
        ))}
      </svg>
    );
  }

  if (visualKey === 'tungro') {
    return (
      <svg viewBox="0 0 320 200" className={className} aria-label="Ilustrasi gejala Tungro daun kuning oranye">
        <rect width="320" height="200" fill="#064E3B" />
        <path d="M30 200C80 120 150 60 270 15C210 85 150 140 90 200Z" fill="#F59E0B" />
        <path d="M80 200C130 130 190 80 295 45C240 110 180 160 130 200Z" fill="#EAB308" />
        <path d="M10 200C50 140 95 90 160 40C125 110 85 160 50 200Z" fill="#22C55E" />
      </svg>
    );
  }

  if (visualKey === 'penggerek') {
    return (
      <svg viewBox="0 0 320 200" className={className} aria-label="Ilustrasi Penggerek Batang Padi">
        <rect width="320" height="200" fill="#14532D" />
        <rect x="40" y="65" width="240" height="70" rx="12" fill="#86EFAC" />
        <rect x="40" y="95" width="240" height="14" fill="#FEF08A" />
        {/* Stem borer larva */}
        <g transform="translate(105, 86)">
          <rect x="0" y="0" width="95" height="22" rx="11" fill="#FDE047" stroke="#CA8A04" strokeWidth="2" />
          <circle cx="12" cy="11" r="8" fill="#92400E" />
          <line x1="30" y1="2" x2="30" y2="20" stroke="#CA8A04" strokeWidth="1.5" />
          <line x1="50" y1="2" x2="50" y2="20" stroke="#CA8A04" strokeWidth="1.5" />
          <line x1="70" y1="2" x2="70" y2="20" stroke="#CA8A04" strokeWidth="1.5" />
        </g>
        {/* Bore hole */}
        <circle cx="225" cy="102" r="9" fill="#451A03" stroke="#92400E" strokeWidth="3" />
      </svg>
    );
  }

  if (visualKey === 'hawar' || visualKey === 'kahat_n') {
    return (
      <svg viewBox="0 0 320 200" className={className} aria-label="Ilustrasi Hawar Daun Bakteri / Defisiensi Hara">
        <rect width="320" height="200" fill="#064E3B" />
        <path d="M20 195C95 115 180 55 300 10C255 95 185 155 110 195Z" fill="#22C55E" />
        {/* Yellow wavy edge lesion */}
        <path d="M120 92C180 52 240 28 300 10C275 52 230 92 175 125C155 112 140 102 120 92Z" fill="#EAB308" />
        <path d="M170 65L285 18" stroke="#92400E" strokeWidth="3" strokeDasharray="6 4" />
      </svg>
    );
  }

  // Default: Blas (Pyricularia oryzae) — diamond-shaped brown lesions with grayish centers on rice leaf
  return (
    <svg viewBox="0 0 320 200" className={className} aria-label="Ilustrasi Daun Padi Terinfeksi Blas Pyricularia oryzae">
      <defs>
        <linearGradient id="darkFoliage" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#052E16" />
          <stop offset="100%" stopColor="#14532D" />
        </linearGradient>
        <linearGradient id="riceLeafBlade" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#4D7C0F" />
          <stop offset="50%" stopColor="#65A30D" />
          <stop offset="100%" stopColor="#84CC16" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#darkFoliage)" />
      {/* Background blurred blades */}
      <path d="M0 160C70 110 140 60 220 0L260 0C180 70 110 130 40 200L0 200Z" fill="#166534" opacity="0.55" />
      <path d="M180 200C220 130 265 70 320 20L320 80C275 125 235 165 210 200Z" fill="#15803D" opacity="0.5" />

      {/* Main diagonal rice leaf blade */}
      <path
        d="M55 200C105 125 168 55 248 0L296 0C226 75 165 142 122 200Z"
        fill="url(#riceLeafBlade)"
      />
      {/* Central leaf midrib */}
      <path
        d="M88 200C142 128 202 62 272 0"
        stroke="#BEF264"
        strokeWidth="2.5"
        opacity="0.75"
        fill="none"
      />

      {/* Diamond-shaped Blast Lesions (Pyricularia oryzae) */}
      {[
        { x: 175, y: 78, scale: 1.15, rot: -42 },
        { x: 142, y: 118, scale: 1.0, rot: -42 },
        { x: 210, y: 48, scale: 0.9, rot: -42 },
        { x: 118, y: 152, scale: 0.95, rot: -42 },
        { x: 162, y: 138, scale: 0.75, rot: -42 },
        { x: 196, y: 95, scale: 0.8, rot: -42 },
      ].map((lesion, idx) => (
        <g
          key={idx}
          transform={`translate(${lesion.x}, ${lesion.y}) rotate(${lesion.rot}) scale(${lesion.scale})`}
        >
          {/* Yellowish halo */}
          <path d="M-22 0 Q0 -11 22 0 Q0 11 -22 0Z" fill="#EAB308" opacity="0.65" />
          {/* Necrotic dark brown border */}
          <path d="M-18 0 Q0 -8.5 18 0 Q0 8.5 -18 0Z" fill="#78350F" />
          {/* Grayish-white sporulating center */}
          <path d="M-10 0 Q0 -4.5 10 0 Q0 4.5 -10 0Z" fill="#D6D3D1" />
        </g>
      ))}
    </svg>
  );
};

/**
 * Ilustrasi Kemasan Produk Pestisida Resmi (Score 250 EC / Antracol 70 WP) sesuai Layar 6, 7 & 17.
 */
export const PesticideProductBottleSvg: React.FC<{
  productId: string;
  className?: string;
}> = ({ productId, className = 'w-16 h-20' }) => {
  const isAntracol = productId.includes('antracol');
  if (isAntracol) {
    return (
      <svg viewBox="0 0 80 100" className={className} aria-hidden="true">
        {/* Foil pouch shape */}
        <rect x="12" y="10" width="56" height="80" rx="8" fill="#15803D" stroke="#14532D" strokeWidth="2" />
        <rect x="12" y="10" width="56" height="16" rx="4" fill="#FACC15" />
        <rect x="18" y="34" width="44" height="36" rx="4" fill="#FFFFFF" />
        <text x="40" y="49" textAnchor="middle" fill="#14532D" fontSize="8.5" fontWeight="bold">
          ANTRACOL
        </text>
        <text x="40" y="61" textAnchor="middle" fill="#15803D" fontSize="7" fontWeight="bold">
          70 WP
        </text>
      </svg>
    );
  }

  // Default bottle (Score 250 EC / Plenum / Virtako)
  return (
    <svg viewBox="0 0 80 100" className={className} aria-hidden="true">
      {/* Bottle cap */}
      <rect x="28" y="6" width="24" height="12" rx="3" fill="#1E3A8A" />
      {/* Bottle neck */}
      <rect x="31" y="18" width="18" height="8" fill="#E2E8F0" />
      {/* Bottle body */}
      <rect x="18" y="25" width="44" height="68" rx="9" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
      {/* Label */}
      <rect x="20" y="38" width="40" height="42" rx="3" fill="#FFFFFF" stroke="#15803D" strokeWidth="1.5" />
      <rect x="20" y="38" width="40" height="11" fill="#15803D" />
      <text x="40" y="46" textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="bold">
        FUNGISIDA
      </text>
      <text x="40" y="60" textAnchor="middle" fill="#17231B" fontSize="8" fontWeight="bold">
        SCORE
      </text>
      <text x="40" y="70" textAnchor="middle" fill="#15803D" fontSize="7" fontWeight="bold">
        250 EC
      </text>
    </svg>
  );
};
