"use client";

interface MotoLinkLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
}

export function MotoLinkLogo({ className = "", size = "md", variant = "full" }: MotoLinkLogoProps) {
  const sizes = {
    sm: { width: 120, height: 32 },
    md: { width: 160, height: 42 },
    lg: { width: 200, height: 52 },
  };

  const { width, height } = sizes[size];

  if (variant === "icon") {
    // Just the pin marker icon
    return (
      <svg
        width={height}
        height={height}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Concentric rings */}
        <ellipse cx="24" cy="42" rx="14" ry="4" fill="none" stroke="#F5A623" strokeWidth="1.5" opacity="0.6" />
        <ellipse cx="24" cy="42" rx="10" ry="3" fill="none" stroke="#E8900A" strokeWidth="1.5" opacity="0.8" />
        <ellipse cx="24" cy="42" rx="6" ry="2" fill="none" stroke="#DC3545" strokeWidth="1.5" />

        {/* Pin marker */}
        <path
          d="M24 4C17.373 4 12 9.373 12 16c0 9 12 22 12 22s12-13 12-22c0-6.627-5.373-12-12-12z"
          fill="#DC3545"
        />
        {/* Pin gradient overlay for 3D effect */}
        <path
          d="M24 4C17.373 4 12 9.373 12 16c0 9 12 22 12 22V4z"
          fill="#C82333"
        />
        {/* White circle in pin */}
        <circle cx="24" cy="16" r="5" fill="white" />
      </svg>
    );
  }

  // Full logo with text
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* M */}
      <text x="0" y="38" fontFamily="Arial Black, Arial, sans-serif" fontSize="36" fontWeight="900" fill="white">
        M
      </text>

      {/* Location Pin (replacing O) */}
      <g transform="translate(28, 2)">
        {/* Concentric rings */}
        <ellipse cx="16" cy="44" rx="12" ry="3.5" fill="none" stroke="#F5A623" strokeWidth="1.2" opacity="0.5" />
        <ellipse cx="16" cy="44" rx="8" ry="2.5" fill="none" stroke="#E8900A" strokeWidth="1.2" opacity="0.7" />
        <ellipse cx="16" cy="44" rx="4" ry="1.5" fill="none" stroke="#DC3545" strokeWidth="1" />

        {/* Pin marker */}
        <path
          d="M16 2C10.477 2 6 6.477 6 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.523-4.477-10-10-10z"
          fill="#DC3545"
        />
        {/* Pin gradient overlay for 3D effect */}
        <path
          d="M16 2C10.477 2 6 6.477 6 12c0 7.5 10 18 10 18V2z"
          fill="#B21F2D"
        />
        {/* White circle in pin */}
        <circle cx="16" cy="12" r="4" fill="white" />
      </g>

      {/* TO */}
      <text x="60" y="38" fontFamily="Arial Black, Arial, sans-serif" fontSize="36" fontWeight="900" fill="white">
        TO
      </text>

      {/* LINK */}
      <text x="114" y="38" fontFamily="Arial Black, Arial, sans-serif" fontSize="36" fontWeight="900" fill="#DC3545">
        LINK
      </text>
    </svg>
  );
}

// Inline SVG version for places where we need direct JSX
export function MotoLinkLogoInline({ dark = false }: { dark?: boolean }) {
  const textColor = dark ? "white" : "white";

  return (
    <div className="flex items-center">
      {/* M */}
      <span className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: "Arial Black, sans-serif" }}>
        M
      </span>

      {/* Pin Icon */}
      <svg width="28" height="36" viewBox="0 0 32 44" fill="none" className="-mx-0.5 -mb-1">
        {/* Concentric rings */}
        <ellipse cx="16" cy="40" rx="10" ry="2.5" fill="none" stroke="#F5A623" strokeWidth="1" opacity="0.5" />
        <ellipse cx="16" cy="40" rx="6" ry="1.8" fill="none" stroke="#E8900A" strokeWidth="1" opacity="0.7" />
        <ellipse cx="16" cy="40" rx="3" ry="1" fill="none" stroke="#DC3545" strokeWidth="0.8" />

        {/* Pin marker */}
        <path
          d="M16 2C10.477 2 6 6.477 6 12c0 7 10 16 10 16s10-9 10-16c0-5.523-4.477-10-10-10z"
          fill="#DC3545"
        />
        <path
          d="M16 2C10.477 2 6 6.477 6 12c0 7 10 16 10 16V2z"
          fill="#B21F2D"
        />
        <circle cx="16" cy="12" r="3.5" fill="white" />
      </svg>

      {/* TO */}
      <span className="text-2xl font-black text-white tracking-tight -ml-0.5" style={{ fontFamily: "Arial Black, sans-serif" }}>
        TO
      </span>

      {/* LINK */}
      <span className="text-2xl font-black text-[#DC3545] tracking-tight" style={{ fontFamily: "Arial Black, sans-serif" }}>
        LINK
      </span>
    </div>
  );
}
