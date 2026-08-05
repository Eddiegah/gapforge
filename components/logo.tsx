import { cn } from "@/lib/utils";

interface LogoIconProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 32, className }: LogoIconProps) {
  // Use a stable ID suffix to avoid conflicts when multiple instances render
  const gradId = "gf-bg-grad";
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
        <linearGradient id={gradId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>

      {/* Background: rounded rect with violet gradient */}
      <rect width="32" height="32" rx="8" fill={`url(#${gradId})`} />

      {/* Stylized "G" with a deliberate gap on the right side */}
      {/* Top-left arc / serif of G — top bar */}
      <path
        d="M20 9H13C10.24 9 8 11.24 8 14V18C8 20.76 10.24 23 13 23H18"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Middle crossbar of G (the "gap" — it stops before closing the right side) */}
      <path
        d="M16 16H20"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Right vertical stub — deliberately SHORT so there's a visible gap above */}
      <path
        d="M20 19V23"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Spark / forge lightning — 3-pointed, top-right corner */}
      <path
        d="M24 7L22 11.5L24.5 11L22 16"
        stroke="white"
        strokeWidth="1.6"
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
