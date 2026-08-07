import { cn } from "@/lib/utils";

interface LogoIconProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 32, className }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GapForge logo"
    >
      <defs>
        <linearGradient id="gf-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="gf-glow" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Background with rounded square */}
      <rect width="40" height="40" rx="10" fill="url(#gf-bg)" />
      <rect width="40" height="40" rx="10" fill="url(#gf-glow)" />

      {/* Magnifying glass / search lens — represents discovery */}
      <circle cx="17" cy="17" r="7.5" stroke="white" strokeWidth="2.5" fill="none" strokeOpacity="0.95" />

      {/* Gap in the circle — the "gap" metaphor, top-right break */}
      <path d="M22.5 11.5 L24.5 9.5" stroke="url(#gf-bg)" strokeWidth="3" strokeLinecap="round" />

      {/* Search handle — angled bottom-right */}
      <line x1="22.5" y1="22.5" x2="29" y2="29" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeOpacity="0.95" />

      {/* Lightning bolt spark — the "forge" / intelligence element */}
      <path d="M26 10 L23.5 15 L26.5 15 L24 20" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" fill="none" />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export function Logo({ size = 28, showText = true, className, textClassName }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoIcon size={size} />
      {showText && (
        <span className={cn("font-bold text-[rgb(var(--fg))] tracking-tight", textClassName)}>
          GapForge
        </span>
      )}
    </div>
  );
}
