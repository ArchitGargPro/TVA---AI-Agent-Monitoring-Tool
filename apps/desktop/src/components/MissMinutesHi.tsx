/**
 * Static Miss Minutes greeting for the MinuteControl hub — no animation.
 */
export function MissMinutesHi() {
  return (
    <div className="flex items-center justify-center gap-0" aria-hidden>
      {/* Speech bubble — tail on the right, pointing at her face */}
      <svg viewBox="0 0 64 40" className="mb-8 h-10 w-16 shrink-0">
        <path
          d="M6 4h38a6 6 0 0 1 6 6v12c0 2.2-1.2 4.1-3 5.2L58 34l-9.5-2.2A6 6 0 0 1 44 34H6a6 6 0 0 1-6-6V10a6 6 0 0 1 6-6z"
          fill="#fff"
          stroke="#1a1a1a"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <text
          x="25"
          y="20"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#1a1a1a"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize="13"
          fontWeight="700"
        >
          Hi
        </text>
      </svg>

      <svg viewBox="0 0 112 120" className="h-[112px] w-[104px] drop-shadow-md">
        <path
          d="M36 58 Q24 64 18 76"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <ellipse cx="15" cy="80" rx="7.5" ry="6" fill="#fff" stroke="#1a1a1a" strokeWidth="1.4" />
        <path
          d="M76 58 Q90 62 96 74"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <ellipse cx="99" cy="78" rx="7.5" ry="6" fill="#fff" stroke="#1a1a1a" strokeWidth="1.4" />

        <line x1="48" y1="86" x2="45" y2="104" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="64" y1="86" x2="67" y2="104" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="43" cy="108" rx="10" ry="5" fill="#f97316" stroke="#1a1a1a" strokeWidth="1.4" />
        <ellipse cx="69" cy="108" rx="10" ry="5" fill="#f97316" stroke="#1a1a1a" strokeWidth="1.4" />

        <circle cx="56" cy="50" r="32" fill="#ea580c" stroke="#1a1a1a" strokeWidth="2.6" />
        <circle cx="56" cy="50" r="28" fill="#f97316" />

        {[0, 30, 60, 90, 120, 150].map((deg) => {
          const rad = ((deg - 90) * Math.PI) / 180;
          return (
            <line
              key={deg}
              x1={56 + Math.cos(rad) * 21}
              y1={50 + Math.sin(rad) * 21}
              x2={56 + Math.cos(rad) * 26}
              y2={50 + Math.sin(rad) * 26}
              stroke="#1a1a1a"
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}

        <ellipse cx="46" cy="44" rx="7" ry="9" fill="#fff" stroke="#1a1a1a" strokeWidth="1.5" />
        <ellipse cx="66" cy="44" rx="7" ry="9" fill="#fff" stroke="#1a1a1a" strokeWidth="1.5" />
        <circle cx="45" cy="44" r="3.4" fill="#1a1a1a" />
        <circle cx="65" cy="44" r="3.4" fill="#1a1a1a" />

        <path
          d="M40 35 L38 30 M44 34 L43 29 M50 34 L51 29"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path
          d="M62 34 L61 29 M68 34 L69 29 M74 35 L76 30"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="1.3"
          strokeLinecap="round"
        />

        <line x1="56" y1="50" x2="56" y2="30" stroke="#1a1a1a" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="56" y1="50" x2="70" y2="56" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="56" cy="50" r="2.8" fill="#fbbf24" stroke="#1a1a1a" strokeWidth="1.2" />

        <path
          d="M48 61 Q56 67 64 61"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
