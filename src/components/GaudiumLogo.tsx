import React from "react";

export function GaudiumLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 
        This is a beautiful 3D multi-pointed star polyhedron, 
        replicating the colorful 5-point stellation from the image.
        Each star point is composed of two colored triangles (shaded + highlight).
      */}
      <g>
        {/* CENTER PIVOT AND FACETS */}
        
        {/* 1. TOP-RIGHT POINT: CYAN/BLUE */}
        {/* Highlight side (light blue) */}
        <polygon
          points="128,128 128,40 180,90"
          fill="#38bdf8"
        />
        {/* Shadow side (darker blue) */}
        <polygon
          points="128,128 180,90 190,128"
          fill="#0284c7"
        />

        {/* 2. BOTTOM-RIGHT POINT: GREEN */}
        {/* Highlight side */}
        <polygon
          points="128,128 190,128 210,180"
          fill="#4ade80"
        />
        {/* Shadow side */}
        <polygon
          points="128,128 210,180 155,190"
          fill="#16a34a"
        />

        {/* 3. BOTTOM POINT: YELLOW/GOLD */}
        {/* Highlight side */}
        <polygon
          points="128,128 155,190 128,230"
          fill="#facc15"
        />
        {/* Shadow side */}
        <polygon
          points="128,128 128,230 101,190"
          fill="#ca8a04"
        />

        {/* 4. BOTTOM-LEFT POINT: RED */}
        {/* Highlight side */}
        <polygon
          points="128,128 101,190 46,180"
          fill="#f87171"
        />
        {/* Shadow side */}
        <polygon
          points="128,128 46,180 66,128"
          fill="#dc2626"
        />

        {/* 5. TOP-LEFT POINT: ORANGE/AMBER */}
        {/* Highlight/Upper side */}
        <polygon
          points="128,128 66,128 76,90"
          fill="#fb923c"
        />
        {/* Highlight/Lower side */}
        <polygon
          points="128,128 76,90 128,40"
          fill="#eab308"
        />
        
        {/* ADDITIONAL DEPTH FACETS OVERLAYS */}
        <polygon
          points="128,128 128,40 76,90"
          fill="#f97316"
          opacity="0.9"
        />
        <polygon
          points="128,128 180,90 128,40"
          fill="#0ea5e9"
          opacity="0.85"
        />
      </g>
    </svg>
  );
}
