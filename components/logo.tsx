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
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GapForge logo"
    >
      <defs>
        <linearGradient id="gf-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      {/* Outer rounded square */}
      <rect width="32" height="32" rx="8" fill="url(#gf-grad)" />
      {/* G shape — stylized gap/opening */}
      {/* Left vertical bar */}
      <rect x="7" y="8" width="4" height="16" rx="2" fill="white" />
      {/* Top horizontal bar */}
      <rect x="7" y="8" width="12" height="4" rx="2" fill="white" />
      {/* Bottom horizontal bar */}
      <rect x="7" y="20" width="12" height="4" rx="2" fill="white" />
      {/* Middle gap bar — the "gap" in GapForge */}
      <rect x="15" y="15" width="7" height="3" rx="1.5" fill="white" />
      {/* Lightning bolt / forge spark */}
      <path
        d="M22 9L19 15.5H22L19 23"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
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
