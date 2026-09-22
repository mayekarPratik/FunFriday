import React from 'react';

interface TheLobbyLogoProps {
  className?: string;
  size?: 'normal' | 'large' | 'compact';
}

export const TheLobbyLogo: React.FC<TheLobbyLogoProps> = ({
  className = '',
  size = 'large'
}) => {
  const isLarge = size === 'large';
  const isCompact = size === 'compact';

  return (
    <div
      className={`relative select-none flex flex-col items-center justify-center font-['Cinzel',_serif] ${className}`}
      style={{
        filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.9)) drop-shadow(0 0 35px rgba(139,0,0,0.25))'
      }}
    >
      <svg
        className="w-full h-auto overflow-visible"
        viewBox="0 0 600 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ maxWidth: isLarge ? '520px' : isCompact ? '320px' : '420px' }}
      >
        <defs>
          {/* Weathered Dark Stone / Metal Gradient */}
          <linearGradient id="metal-stone-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D5D9E0" />
            <stop offset="25%" stopColor="#8A93A4" />
            <stop offset="65%" stopColor="#414856" />
            <stop offset="100%" stopColor="#1B1E26" />
          </linearGradient>

          {/* Top Bevel Highlight */}
          <linearGradient id="bevel-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="30%" stopColor="#CBD5E1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1E293B" stopOpacity="0" />
          </linearGradient>

          {/* Deep Viscous Blood Gradient */}
          <linearGradient id="blood-deep-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5E0303" />
            <stop offset="30%" stopColor="#8B0000" />
            <stop offset="65%" stopColor="#B91C1C" />
            <stop offset="90%" stopColor="#7F0505" />
            <stop offset="100%" stopColor="#3B0101" />
          </linearGradient>

          {/* Blood Highlight Reflection */}
          <linearGradient id="blood-sheen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.1" />
            <stop offset="40%" stopColor="#FFA4A4" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8B0000" stopOpacity="0.2" />
          </linearGradient>

          {/* Drip Vertical Stream Sheen */}
          <linearGradient id="drip-sheen-vert" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#500000" />
            <stop offset="30%" stopColor="#DC2626" />
            <stop offset="50%" stopColor="#FFA6A6" />
            <stop offset="70%" stopColor="#990000" />
            <stop offset="100%" stopColor="#3D0000" />
          </linearGradient>

          {/* Chiseled Stone Filter for 3D Bevel & Carve Depth */}
          <filter id="chisel-emboss" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feOffset in="blur" dx="0" dy="2" result="offset" />
            <feSpecularLighting in="blur" surfaceScale="3" specularConstant="1.2" specularExponent="15" lightingColor="#ffffff" result="spec">
              <fePointLight x="300" y="-80" z="220" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="specOut" />
            </feMerge>
          </filter>

          {/* Blood Wet Gloss Filter */}
          <filter id="blood-wet-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="glow" />
            <feColorMatrix
              in="glow"
              type="matrix"
              values="1 0 0 0 0.4
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.8 0"
              result="redGlow"
            />
            <feMerge>
              <feMergeNode in="redGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Dark Back Shadow for Entire Logo */}
        <g opacity="0.9" transform="translate(0, 4)">
          <text
            x="300"
            y="52"
            textAnchor="middle"
            className="font-['Cinzel'] font-black tracking-[0.35em]"
            fontSize="38"
            fill="#05070A"
            letterSpacing="0.25em"
          >
            THE
          </text>
          <text
            x="300"
            y="148"
            textAnchor="middle"
            className="font-['Cinzel'] font-black tracking-[0.14em]"
            fontSize="102"
            fill="#030407"
            letterSpacing="0.12em"
          >
            LOBBY
          </text>
        </g>

        {/* ============================================================ */}
        {/* TOP WORD: "THE"                                             */}
        {/* ============================================================ */}
        <g id="word-the" filter="url(#chisel-emboss)">
          {/* Base Metal Texture */}
          <text
            x="300"
            y="50"
            textAnchor="middle"
            className="font-['Cinzel'] font-black"
            fontSize="38"
            fill="url(#metal-stone-grad)"
            stroke="#1B1E26"
            strokeWidth="1.5"
            strokeLinejoin="miter"
            letterSpacing="0.25em"
          >
            THE
          </text>

          {/* Top Bevel Stroke for razor-sharp metal rim */}
          <text
            x="300"
            y="50"
            textAnchor="middle"
            className="font-['Cinzel'] font-black"
            fontSize="38"
            fill="none"
            stroke="url(#bevel-highlight)"
            strokeWidth="0.8"
            letterSpacing="0.25em"
          >
            THE
          </text>

          {/* Blood Accent on 'E' of "THE" */}
          <path
            d="M344 40 C345 42, 348 44, 351 45 C353 46, 356 47, 356 50 C356 52, 352 53, 349 52 C347 51, 345 48, 344 46 Z"
            fill="url(#blood-deep-grad)"
            filter="url(#blood-wet-glow)"
          />
          <path
            d="M352 48 Q354 53 353 58 Q351 59 350 57 Q351 52 352 48"
            fill="#8B0000"
            opacity="0.9"
          />
        </g>

        {/* ============================================================ */}
        {/* MAIN WORD: "LOBBY"                                          */}
        {/* ============================================================ */}
        <g id="word-lobby" filter="url(#chisel-emboss)">
          {/* 1. Base Carved Metal / Dark Stone Letters */}
          <text
            x="300"
            y="145"
            textAnchor="middle"
            className="font-['Cinzel'] font-black"
            fontSize="102"
            fill="url(#metal-stone-grad)"
            stroke="#151820"
            strokeWidth="2.5"
            strokeLinejoin="miter"
            letterSpacing="0.12em"
          >
            LOBBY
          </text>

          {/* 2. Top Specular Bevel Highlights on Serifs */}
          <text
            x="300"
            y="145"
            textAnchor="middle"
            className="font-['Cinzel'] font-black"
            fontSize="102"
            fill="none"
            stroke="url(#bevel-highlight)"
            strokeWidth="1.2"
            letterSpacing="0.12em"
          >
            LOBBY
          </text>
        </g>

        {/* ============================================================ */}
        {/* BLOOD STAINS OVERLAY ON SPECIFIC LETTERS (L, O, B, B, Y)     */}
        {/* ============================================================ */}
        <g id="blood-stains" filter="url(#blood-wet-glow)">
          {/* 'L' Blood Stain on spine & foot */}
          <path
            d="M98 90 Q96 115 97 142 Q105 145 130 144 Q142 143 145 141 Q140 137 132 136 Q116 137 114 130 Q112 115 111 98 Q103 94 98 90 Z"
            fill="url(#blood-deep-grad)"
            opacity="0.92"
          />
          {/* 'L' Wet Specular Ridge */}
          <path
            d="M100 110 Q99 128 101 141 Q115 142 134 140"
            stroke="url(#blood-sheen)"
            strokeWidth="1.2"
            fill="none"
            opacity="0.8"
          />

          {/* 'O' Massive Curved Blood Stain (bottom half soaked) */}
          <path
            d="M175 115 Q176 135 192 146 Q215 152 238 144 Q254 133 255 115 Q245 125 230 130 Q215 132 200 128 Q185 122 175 115 Z"
            fill="url(#blood-deep-grad)"
            opacity="0.95"
          />
          {/* 'O' Inner ring blood coat */}
          <path
            d="M192 118 Q195 132 215 134 Q234 132 238 118 Q230 126 215 127 Q200 126 192 118 Z"
            fill="#5E0303"
          />
          {/* 'O' Wet Glaze Arc */}
          <path
            d="M178 122 Q194 146 215 148 Q236 146 252 122"
            stroke="url(#blood-sheen)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.85"
          />

          {/* First 'B' Blood Stain (lower bowl & center join) */}
          <path
            d="M272 105 Q288 106 295 112 Q302 120 300 132 Q295 145 272 144 Q282 140 286 132 Q288 122 278 115 Q272 110 272 105 Z"
            fill="url(#blood-deep-grad)"
            opacity="0.93"
          />
          <path
            d="M274 125 Q288 135 296 130"
            stroke="url(#blood-sheen)"
            strokeWidth="1.2"
            fill="none"
          />

          {/* Second 'B' Blood Stain (heavy dripping splatter) */}
          <path
            d="M352 95 Q368 98 375 106 Q382 118 376 130 Q370 144 348 144 Q360 138 364 128 Q366 116 355 108 Q352 102 352 95 Z"
            fill="url(#blood-deep-grad)"
            opacity="0.94"
          />
          <path
            d="M355 118 Q370 128 373 125"
            stroke="url(#blood-sheen)"
            strokeWidth="1.2"
            fill="none"
          />

          {/* 'Y' Blood Stain (right branch and center stem) */}
          <path
            d="M446 88 Q440 102 432 114 Q428 126 428 144 Q435 144 436 128 Q442 114 456 94 Q450 90 446 88 Z"
            fill="url(#blood-deep-grad)"
            opacity="0.95"
          />
          <path
            d="M448 92 Q434 116 432 138"
            stroke="url(#blood-sheen)"
            strokeWidth="1.3"
            fill="none"
            opacity="0.8"
          />
        </g>

        {/* ============================================================ */}
        {/* SLOW-MOVING BLOOD DRIPS & TRAILING RUNOFF GRAPHICS          */}
        {/* ============================================================ */}
        <g id="animated-blood-drips">
          {/* --- DRIP 1: From 'L' corner (x: 104) --- */}
          <g className="animate-drip-slow origin-top">
            {/* Hanging stalk */}
            <path
              d="M103 143 C103 150, 102 165, 103 175 C103.5 178, 106.5 178, 106 175 C105 165, 106 150, 106 143 Z"
              fill="url(#drip-sheen-vert)"
            />
            {/* Droplet bulb */}
            <ellipse cx="104.5" cy="177" rx="3" ry="4" fill="#990000" />
            <ellipse cx="104" cy="176" rx="1.2" ry="1.8" fill="#FFA4A4" opacity="0.85" />
          </g>

          {/* --- DRIP 2: From 'O' left base (x: 198) --- */}
          <g className="animate-drip-pulse origin-top">
            <path
              d="M196 146 C196 158, 194 185, 196 205 C197 210, 201 210, 200 205 C198 185, 200 158, 200 146 Z"
              fill="url(#drip-sheen-vert)"
            />
            {/* Droplet bulb */}
            <ellipse cx="198" cy="207" rx="3.5" ry="5.5" fill="#8B0000" />
            <ellipse cx="197" cy="205.5" rx="1.3" ry="2.2" fill="#FFA4A4" opacity="0.9" />
          </g>

          {/* --- DRIP 3: From 'O' right base (x: 232) --- */}
          <g className="animate-drip-slow origin-top" style={{ animationDelay: '1.2s' }}>
            <path
              d="M230 146 C230 156, 229 172, 231 186 C231.5 189, 234.5 189, 234 186 C232 172, 233 156, 233 146 Z"
              fill="url(#drip-sheen-vert)"
            />
            <ellipse cx="232" cy="188" rx="2.8" ry="4" fill="#990000" />
            <ellipse cx="231.5" cy="187" rx="1" ry="1.6" fill="#FFA4A4" opacity="0.8" />
          </g>

          {/* --- DRIP 4: From first 'B' heavy flow (x: 288) --- */}
          <g className="animate-drip-pulse origin-top" style={{ animationDelay: '0.6s' }}>
            <path
              d="M285 144 C285 160, 283 195, 286 220 C287 225, 292 225, 290 220 C287 195, 289 160, 289 144 Z"
              fill="url(#drip-sheen-vert)"
            />
            <ellipse cx="288" cy="223" rx="4" ry="6" fill="#7F0000" />
            <ellipse cx="287" cy="221.5" rx="1.5" ry="2.5" fill="#FFFFFF" opacity="0.85" />
          </g>

          {/* --- DRIP 5: From second 'B' spine (x: 358) --- */}
          <g className="animate-drip-slow origin-top" style={{ animationDelay: '1.8s' }}>
            <path
              d="M356 144 C356 154, 355 168, 357 178 C357.5 181, 360.5 181, 360 178 C358 168, 359 154, 359 144 Z"
              fill="url(#drip-sheen-vert)"
            />
            <ellipse cx="358" cy="180" rx="2.6" ry="3.8" fill="#990000" />
            <ellipse cx="357.5" cy="179" rx="1" ry="1.5" fill="#FFA4A4" opacity="0.8" />
          </g>

          {/* --- DRIP 6: From second 'B' outer lobe (x: 374) --- */}
          <g className="animate-drip-pulse origin-top" style={{ animationDelay: '2.4s' }}>
            <path
              d="M372 134 C372 145, 370 160, 372 170 C372.5 173, 375.5 173, 375 170 C373 160, 374 145, 374 134 Z"
              fill="url(#drip-sheen-vert)"
            />
            <ellipse cx="373.5" cy="172" rx="2.5" ry="3.5" fill="#8B0000" />
            <ellipse cx="373" cy="171" rx="0.9" ry="1.4" fill="#FFA4A4" opacity="0.8" />
          </g>

          {/* --- DRIP 7: From 'Y' tail (x: 432) - Long dramatic trail --- */}
          <g className="animate-drip-pulse origin-top" style={{ animationDelay: '1.5s' }}>
            <path
              d="M430 144 C430 162, 429 198, 431 228 C431.5 233, 435.5 233, 434 228 C432 198, 433 162, 433 144 Z"
              fill="url(#drip-sheen-vert)"
            />
            <ellipse cx="432.5" cy="231" rx="3.5" ry="5.5" fill="#7A0000" />
            <ellipse cx="431.8" cy="229.5" rx="1.2" ry="2.2" fill="#FFFFFF" opacity="0.85" />
          </g>

          {/* Falling Detached Micro-Droplets */}
          <g className="animate-falling-droplet-1">
            <circle cx="288" cy="230" r="2.2" fill="#B91C1C" opacity="0.9" />
          </g>
          <g className="animate-falling-droplet-2">
            <circle cx="432.5" cy="238" r="2" fill="#DC2626" opacity="0.85" />
          </g>
        </g>
      </svg>
    </div>
  );
};

export default TheLobbyLogo;
