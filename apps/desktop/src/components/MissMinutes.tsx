import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

interface MissMinutesProps {
  attention: boolean;
  activeCount: number;
  glowing?: boolean;
}

type Gaze = "left" | "center" | "right";

/**
 * Miss Minutes — orange clock mascot with limbs and glancing eyes.
 */
export function MissMinutes({ attention, activeCount, glowing = false }: MissMinutesProps) {
  const reduceMotion = useReducedMotion();
  const busy = activeCount > 0;
  const [gaze, setGaze] = useState<Gaze>("center");

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    function scheduleGlance() {
      timer = setTimeout(() => {
        if (cancelled) {
          return;
        }
        const roll = Math.random();
        setGaze(roll < 0.35 ? "left" : roll < 0.7 ? "right" : "center");
        scheduleGlance();
      }, 1600 + Math.random() * 2400);
    }

    scheduleGlance();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reduceMotion]);

  const pupilDx = gaze === "left" ? -2.4 : gaze === "right" ? 2.4 : 0;

  return (
    <div className="relative flex h-[120px] w-[112px] items-end justify-center">
      {/* Update glow — stays until hover/click clears it */}
      <motion.div
        className="pointer-events-none absolute inset-x-1 bottom-4 top-1 rounded-full"
        style={{
          background: glowing
            ? "radial-gradient(circle, rgba(255,170,40,0.85) 0%, rgba(255,120,0,0.4) 45%, transparent 72%)"
            : attention
              ? "radial-gradient(circle, rgba(255,80,80,0.35) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(255,140,0,0.2) 0%, transparent 70%)",
        }}
        animate={
          reduceMotion
            ? { opacity: glowing ? 0.9 : 0.35 }
            : glowing
              ? { opacity: [0.55, 1, 0.55], scale: [0.95, 1.14, 0.95] }
              : { opacity: [0.28, 0.42, 0.28], scale: [1, 1.03, 1] }
        }
        transition={{ duration: glowing ? 1.1 : 2.8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative"
        animate={
          reduceMotion
            ? undefined
            : attention
              ? { y: [0, -1, 0, 1, 0] }
              : busy
                ? { y: [0, -2, 0] }
                : { y: [0, -1, 0] }
        }
        transition={{
          duration: attention ? 1.4 : busy ? 2.4 : 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg viewBox="0 0 112 120" className="h-[120px] w-[112px] drop-shadow-lg" aria-hidden>
          <path
            d="M36 58 Q24 64 18 76"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <ellipse cx="15" cy="80" rx="7.5" ry="6" fill="#fff" stroke="#1a1a1a" strokeWidth="1.4" />
          <path
            d="M10 78 Q8 82 10 84"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="1.1"
            strokeLinecap="round"
          />

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

          <motion.g
            animate={{ x: pupilDx }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
          >
            <circle cx="46" cy="44" r="3.4" fill="#1a1a1a" />
            <circle cx="66" cy="44" r="3.4" fill="#1a1a1a" />
          </motion.g>

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

          <motion.g
            style={{ originX: "56px", originY: "50px" }}
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 8, ease: "linear", repeat: Infinity }}
          >
            <line x1="56" y1="50" x2="56" y2="30" stroke="#1a1a1a" strokeWidth="2.4" strokeLinecap="round" />
          </motion.g>
          <motion.g
            style={{ originX: "56px", originY: "50px" }}
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 48, ease: "linear", repeat: Infinity }}
          >
            <line x1="56" y1="50" x2="70" y2="56" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" />
          </motion.g>
          <circle cx="56" cy="50" r="2.8" fill="#fbbf24" stroke="#1a1a1a" strokeWidth="1.2" />

          <path
            d={attention ? "M48 62 Q56 58 64 62" : "M48 61 Q56 67 64 61"}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

      {activeCount > 0 ? (
        <motion.span
          className="absolute right-0 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e11d48] px-1 font-sans text-[10px] font-bold text-white shadow-md"
          animate={reduceMotion ? undefined : { scale: glowing ? [1, 1.18, 1] : [1, 1.08, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        >
          {String(activeCount).padStart(2, "0")}
        </motion.span>
      ) : null}
    </div>
  );
}
