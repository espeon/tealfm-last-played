import React from "react";

export interface GrainOverlayProps {
  opacity?: number;
  blendMode?:
    | "multiply"
    | "overlay"
    | "screen"
    | "normal"
    | "soft-light"
    | "hard-light";
  animate?: boolean;
  grainSize?: "fine" | "medium" | "coarse";
  color1?: string; // First color for two-tone grain
  color2?: string; // Second color for two-tone grain
}

export function GrainOverlay({
  opacity = 0.5,
  blendMode = "overlay",
  animate = false,
  grainSize = "medium",
  color1,
  color2,
}: GrainOverlayProps): React.JSX.Element {
  const grainSizeMap = {
    fine: 0.85,
    medium: 0.64,
    coarse: 0.45,
  };

  const baseFrequency = grainSizeMap[grainSize];

  // Default to black and white if not provided
  const c1 = color1 || "#000000";
  const c2 = color2 || "#eeeeee";

  // Helper to convert hex color to normalized RGB
  function hexToRgbNorm(hex: string) {
    const h = hex.replace("#", "");
    return [
      parseInt(h.substring(0, 2), 16) / 255,
      parseInt(h.substring(2, 4), 16) / 255,
      parseInt(h.substring(4, 6), 16) / 255,
    ];
  }
  const [r1, g1, b1] = hexToRgbNorm(c1);
  const [r2, g2, b2] = hexToRgbNorm(c2);

  // feComponentTransfer for two-tone mapping
  const feTwoTone = (
    <feComponentTransfer>
      <feFuncR type="table" tableValues={`${r1} ${r2}`} />
      <feFuncG type="table" tableValues={`${g1} ${g2}`} />
      <feFuncB type="table" tableValues={`${b1} ${b2}`} />
      <feFuncA
        type="discrete"
        tableValues="0 .5 .5 .5 .5 .5 .5 .5 .5 .5 .5 .5 .5 .5 .5 .5 .5 .5 1"
      />
    </feComponentTransfer>
  );

  return (
    <>
      <svg
        className="pointer-events-none absolute h-24 w-24"
        aria-hidden="true"
      >
        <defs>
          <filter id="grain-static">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={baseFrequency}
              numOctaves="4"
              seed="5"
            />
            {feTwoTone}
          </filter>

          {animate && (
            <filter id="grain-animated">
              <feTurbulence
                type="fractalNoise"
                baseFrequency={baseFrequency}
                numOctaves="4"
                seed="5"
              >
                <animate
                  attributeName="seed"
                  values="0;1;2;3;4;5;6;7;8;9;10"
                  dur="0.8s"
                  repeatCount="indefinite"
                />
              </feTurbulence>
              {feTwoTone}
            </filter>
          )}
        </defs>
      </svg>

      <div
        className="pointer-events-none fixed inset-0"
        style={{
          opacity,
          mixBlendMode: blendMode,
          filter: `url(#grain-${animate ? "animated" : "static"})`,
          willChange: animate ? "filter" : "auto",
        }}
      />

      {/* Alternative CSS-only grain for better performance */}
      {/* <div
        className="pointer-events-none fixed inset-0"
        style={{
          opacity: opacity * 0.5,
          mixBlendMode: blendMode,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='turbulence' baseFrequency='${baseFrequency}' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      /> */}
    </>
  );
}

// Pure CSS grain overlay (most performant)
export function CSSGrainOverlay({
  opacity = 0.08,
  blendMode = "overlay",
}: Pick<GrainOverlayProps, "opacity" | "blendMode">): React.JSX.Element {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity,
        mixBlendMode: blendMode,
        background: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.03) 2px,
            rgba(255, 255, 255, 0.03) 4px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.03) 2px,
            rgba(255, 255, 255, 0.03) 4px
          ),
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.03) 2px,
            rgba(0, 0, 0, 0.03) 4px
          )
        `,
      }}
    />
  );
}

// Preset grain configurations
export const grainPresets = {
  subtle: {
    opacity: 0.04,
    blendMode: "overlay" as const,
    grainSize: "fine" as const,
  },
  medium: {
    opacity: 0.08,
    blendMode: "overlay" as const,
    grainSize: "medium" as const,
  },
  heavy: {
    opacity: 0.12,
    blendMode: "multiply" as const,
    grainSize: "coarse" as const,
  },
  film: {
    opacity: 0.15,
    blendMode: "soft-light" as const,
    grainSize: "medium" as const,
    animate: true,
  },
} as const;
