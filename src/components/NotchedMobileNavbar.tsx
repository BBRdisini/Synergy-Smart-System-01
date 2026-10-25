import React, { useEffect, useRef, useState } from 'react';
import {
  Home,
  Sprout,
  Layers,
  Camera,
  Calendar,
  Wallet,
  User,
  LucideIcon,
} from 'lucide-react';

export type NavTabId =
  | 'beranda'
  | 'lahan'
  | 'budidaya'
  | 'kamera'
  | 'agenda'
  | 'panduan'
  | 'keuangan'
  | 'profil';

interface NavItemConfig {
  id: NavTabId;
  label: string;
  icon: LucideIcon;
  ariaLabel?: string;
}

interface NotchedMobileNavbarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'beranda', label: 'Beranda', icon: Home },
  { id: 'lahan', label: 'Lahan', icon: Sprout },
  { id: 'budidaya', label: 'Budidaya', icon: Layers },
  {
    id: 'kamera',
    label: 'Kamera AI',
    icon: Camera,
    ariaLabel: 'Kamera AI di Tengah',
  },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'keuangan', label: 'Catatan', icon: Wallet },
  { id: 'profil', label: 'Profil', icon: User },
];

/**
 * Generates the white navigation bar SVG path with a tangent-continuous shoulder fillet
 * and true circular arc (`A`) concave notch centered at `(cx, cy)`.
 */
function buildNotchedBarPath(
  width: number,
  height: number,
  cx: number,
  cy: number,
  notchRadius: number,
  shoulderWidth: number
): string {
  const w = Math.max(width, 280);
  const h = height;
  const baseCornerRadius = 22;

  // Transition angle on the notch circle where shoulder bezier meets the circular arc
  const theta = (24 * Math.PI) / 180;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  // Points on the circular notch arc
  const xL = cx - notchRadius * cosT;
  const yL = cy + notchRadius * sinT;
  const xR = cx + notchRadius * cosT;
  const yR = yL;

  // Shoulder start/end points along the top edge y = 0
  const sLx = cx - notchRadius * cosT - shoulderWidth;
  const sRx = cx + notchRadius * cosT + shoulderWidth;

  const topLeftR = Math.max(6, Math.min(baseCornerRadius, sLx - 2));
  const topRightR = Math.max(6, Math.min(baseCornerRadius, w - sRx - 2));
  const bottomR = baseCornerRadius;

  // Tangent lengths for smooth C1 shoulder fillet from horizontal y=0 into the circle tangent (sinT, cosT)
  const handleTop = shoulderWidth * 0.62;
  const handleCircle = shoulderWidth * 0.55;

  const cL1x = sLx + handleTop;
  const cL1y = 0;
  const cL2x = xL - handleCircle * sinT;
  const cL2y = yL - handleCircle * cosT;

  const cR1x = xR + handleCircle * sinT;
  const cR1y = yR - handleCircle * cosT;
  const cR2x = sRx - handleTop;
  const cR2y = 0;

  return [
    `M 0 ${topLeftR}`,
    `Q 0 0 ${topLeftR} 0`,
    `L ${sLx.toFixed(2)} 0`,
    `C ${cL1x.toFixed(2)} ${cL1y.toFixed(2)}, ${cL2x.toFixed(2)} ${cL2y.toFixed(2)}, ${xL.toFixed(2)} ${yL.toFixed(2)}`,
    `A ${notchRadius.toFixed(2)} ${notchRadius.toFixed(2)} 0 0 0 ${xR.toFixed(2)} ${yR.toFixed(2)}`,
    `C ${cR1x.toFixed(2)} ${cR1y.toFixed(2)}, ${cR2x.toFixed(2)} ${cR2y.toFixed(2)}, ${sRx.toFixed(2)} 0`,
    `L ${(w - topRightR).toFixed(2)} 0`,
    `Q ${w} 0 ${w} ${topRightR}`,
    `L ${w} ${h - bottomR}`,
    `Q ${w} ${h} ${w - bottomR} ${h}`,
    `L ${bottomR} ${h}`,
    `Q 0 ${h} 0 ${h - bottomR}`,
    'Z',
  ].join(' ');
}

export const NotchedMobileNavbar: React.FC<NotchedMobileNavbarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [barWidth, setBarWidth] = useState<number>(768);

  const resolvedIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((item) => item.id === activeTab)
  );

  const isCompact = barWidth < 500;
  const padX = isCompact ? 18 : 26;
  const circleDiameter = isCompact ? 46 : 52;
  const circleRadius = circleDiameter / 2;
  // Center of the raised circle sits near the top edge (y = 3px) so half rises above the bar and half sits in the concave notch
  const circleCy = isCompact ? 3 : 4;
  const moatThickness = isCompact ? 5.5 : 6.5;
  const notchRadius = circleRadius + moatThickness;
  const shoulderWidth = isCompact ? 11 : 14;
  const barHeight = isCompact ? 76 : 80;

  const innerWidth = Math.max(200, barWidth - padX * 2);
  const slotWidth = innerWidth / NAV_ITEMS.length;
  const targetCx = padX + slotWidth * (resolvedIndex + 0.5);

  const [animatedCx, setAnimatedCx] = useState<number>(targetCx);
  const prevWidthRef = useRef<number>(barWidth);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setBarWidth(rect.width);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    window.addEventListener('resize', updateWidth);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  useEffect(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const widthChanged = Math.abs(prevWidthRef.current - barWidth) > 1;
    prevWidthRef.current = barWidth;

    if (widthChanged) {
      setAnimatedCx(targetCx);
      return;
    }

    const startCx = animatedCx;
    const delta = targetCx - startCx;
    if (Math.abs(delta) < 0.5) {
      setAnimatedCx(targetCx);
      return;
    }

    const durationMs = 260;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedCx(startCx + delta * eased);

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [targetCx, barWidth]);

  const activeItem = NAV_ITEMS[resolvedIndex] || NAV_ITEMS[0];
  const ActiveIcon = activeItem.icon;

  const barSvgPath = buildNotchedBarPath(
    barWidth,
    barHeight,
    animatedCx,
    circleCy,
    notchRadius,
    shoulderWidth
  );

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="fixed bottom-0 left-0 right-0 z-40 px-2 pb-1.5 pt-8 sm:px-4 sm:pb-2.5 lg:left-1/2 lg:-translate-x-1/2 lg:max-w-3xl pointer-events-none"
    >
      <div
        ref={containerRef}
        style={{ height: `${barHeight}px` }}
        className="relative w-full pointer-events-auto select-none"
      >
        {/* SVG Layer: Concentric Colored Moat Ring + Notched White Bar Body */}
        <svg
          width={barWidth}
          height={barHeight}
          viewBox={`0 0 ${barWidth} ${barHeight}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full overflow-visible drop-shadow-[0_-4px_18px_rgba(20,83,45,0.12)] drop-shadow-[0_10px_28px_rgba(15,23,42,0.14)]"
          aria-hidden="true"
        >
          <defs>
            <clipPath id="notch-moat-clip">
              <rect x="0" y="0.5" width={barWidth} height={barHeight} />
            </clipPath>
          </defs>

          {/* Colored Crescent U-Moat inside the concave notch below y=0.5 */}
          <circle
            cx={animatedCx}
            cy={circleCy}
            r={notchRadius + 1.5}
            fill="#15803D"
            clipPath="url(#notch-moat-clip)"
          />

          {/* Main White Rounded Bar with Smooth Filleted Concave Top Notch */}
          <path
            d={barSvgPath}
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="1.2"
          />
        </svg>

        {/* Raised Pure White Circular Active Icon Badge sitting inside the concave top notch */}
        <div
          style={{
            left: `${animatedCx}px`,
            width: `${circleDiameter}px`,
            height: `${circleDiameter}px`,
            top: `${circleCy - circleRadius}px`,
          }}
          className="absolute -translate-x-1/2 z-20 pointer-events-none flex items-center justify-center"
        >
          <button
            type="button"
            onClick={() => onSelectTab(activeItem.id)}
            aria-label={activeItem.ariaLabel || activeItem.label}
            title={activeItem.label}
            className="group pointer-events-auto w-full h-full rounded-full bg-white border-[2.5px] border-[#15803D] shadow-[0_4px_14px_rgba(20,83,45,0.20)] flex items-center justify-center cursor-pointer transition-transform duration-300 ease-out hover:scale-115 active:scale-95"
          >
            <ActiveIcon
              className="h-6 w-6 sm:h-[25px] sm:w-[25px] text-[#15803D] transition-transform duration-300 ease-out group-hover:scale-125"
              fill="rgba(34, 197, 94, 0.28)"
              stroke="#15803D"
              strokeWidth={2.15}
            />
          </button>
        </div>

        {/* Navigation Columns Row (Icons + Aligned Labels) */}
        <div
          style={{
            paddingLeft: `${padX}px`,
            paddingRight: `${padX}px`,
          }}
          className="relative z-10 grid grid-cols-7 h-full pb-4 pt-2"
        >
          {NAV_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const isActive = idx === resolvedIndex;
            const isCenterCamera = item.id === 'kamera';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-label={item.ariaLabel || item.label}
                aria-current={isActive ? 'page' : undefined}
                className="group relative flex flex-col items-center justify-end h-full pb-1 cursor-pointer focus:outline-none"
              >
                {/* Inactive Icon Slot (Hidden when elevated into the raised notch circle above) */}
                <div
                  className={`flex items-center justify-center h-6 transition-all duration-200 ${
                    isActive
                      ? 'opacity-0 -translate-y-3 pointer-events-none'
                      : 'opacity-100 translate-y-0'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 sm:h-[21px] sm:w-[21px] transition-transform duration-300 ease-out group-hover:scale-125 ${
                      isCenterCamera
                        ? 'text-[#15803D] group-hover:text-[#14532D]'
                        : 'text-slate-500 group-hover:text-[#15803D]'
                    }`}
                    strokeWidth={isCenterCamera ? 2.1 : 1.75}
                  />
                </div>

                {/* Label Row — All labels share the exact same horizontal baseline */}
                <span
                  className={`text-[10px] sm:text-[11px] leading-tight mt-1.5 tracking-tight whitespace-nowrap transition-colors duration-200 ${
                    isActive
                      ? 'font-extrabold text-[#111827]'
                      : isCenterCamera
                      ? 'font-semibold text-[#15803D] group-hover:text-[#14532D]'
                      : 'font-medium text-slate-500 group-hover:text-[#15803D]'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Home Indicator Pill inside the white bar (matching reference image) */}
        <div
          aria-hidden="true"
          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10 w-32 sm:w-40 h-1 rounded-full bg-slate-500/75 pointer-events-none"
        />
      </div>
    </nav>
  );
};
