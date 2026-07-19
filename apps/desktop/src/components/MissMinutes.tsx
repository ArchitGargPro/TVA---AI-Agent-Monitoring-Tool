import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export type GlowMode = "idle" | "processing" | "waiting";

interface MissMinutesProps {
  /** idle = done/quiet · processing = agents working · waiting = needs your input */
  mode?: GlowMode;
  activeCount: number;
  /** Fresh update until hover/click — boosts the current mode briefly */
  glowing?: boolean;
}

type Gaze = "left" | "center" | "right";

/**
 * Miss Minutes — orange clock mascot with limbs, glancing eyes, and status glow.
 */
export function MissMinutes({
  mode = "idle",
  activeCount,
  glowing = false,
}: MissMinutesProps) {
  const reduceMotion = useReducedMotion();
  const [gaze, setGaze] = useState<Gaze>("center");
  const effective: GlowMode = mode === "idle" && glowing ? "processing" : mode;

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
        setGaze(roll < 0.4 ? "left" : roll < 0.8 ? "right" : "center");
        scheduleGlance();
      }, 900 + Math.random() * 1400);
    }

    scheduleGlance();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reduceMotion]);

  const pupilDx = gaze === "left" ? -3.2 : gaze === "right" ? 3.2 : 0;
  const attention = effective === "waiting";
  const processing = effective === "processing";

  return (
    <div className="relative flex h-[120px] w-[112px] items-end justify-center">
      {/* Idle: faint static glow */}
      {effective === "idle" ? (
        <div
          className="pointer-events-none absolute inset-x-[-4px] bottom-2 top-0 rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(255,160,40,0.35) 0%, rgba(255,120,0,0.12) 45%, transparent 70%)",
          }}
        />
      ) : null}

      {/* Processing: drifting / rotating wave glow */}
      {processing ? (
        <motion.div
          className="pointer-events-none absolute inset-x-[-14px] bottom-0 top-[-10px] rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(255,180,40,0.15), rgba(255,140,20,0.75), rgba(255,200,80,0.2), rgba(255,120,0,0.65), rgba(255,180,40,0.15))",
            filter: "blur(6px)",
          }}
          animate={
            reduceMotion
              ? { opacity: 0.7 }
              : { rotate: 360, scale: [0.95, 1.08, 0.95], opacity: [0.55, 0.9, 0.55] }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  rotate: { duration: 7, ease: "linear", repeat: Infinity },
                  scale: { duration: 3.4, ease: "easeInOut", repeat: Infinity },
                  opacity: { duration: 3.4, ease: "easeInOut", repeat: Infinity },
                }
          }
        />
      ) : null}

      {/* Waiting: aggressive red ↔ yellow pulse */}
      {attention ? (
        <motion.div
          className="pointer-events-none absolute inset-x-[-16px] bottom-[-2px] top-[-12px] rounded-full"
          style={{
            filter: "blur(5px)",
          }}
          animate={
            reduceMotion
              ? { opacity: 0.85 }
              : {
                  opacity: [0.55, 1, 0.55],
                  scale: [0.9, 1.18, 0.9],
                  background: [
                    "radial-gradient(circle, rgba(255,60,60,0.95) 0%, rgba(255,180,40,0.55) 40%, transparent 70%)",
                    "radial-gradient(circle, rgba(255,200,40,0.95) 0%, rgba(255,50,50,0.55) 40%, transparent 70%)",
                    "radial-gradient(circle, rgba(255,60,60,0.95) 0%, rgba(255,180,40,0.55) 40%, transparent 70%)",
                  ],
                }
          }
          transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}

      {/* Extra boost when a fresh update arrives */}
      {glowing && effective !== "waiting" ? (
        <motion.div
          className="pointer-events-none absolute inset-x-[-12px] bottom-0 top-[-8px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,200,60,0.9) 0%, rgba(255,120,0,0.4) 45%, transparent 70%)",
            filter: "blur(4px)",
          }}
          animate={reduceMotion ? { opacity: 0.8 } : { opacity: [0.5, 1, 0.5], scale: [0.95, 1.1, 0.95] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}

      <motion.div
        className="relative"
        style={{
          filter:
            effective === "waiting"
              ? "drop-shadow(0 0 16px rgba(255,80,40,0.85))"
              : processing
                ? "drop-shadow(0 0 12px rgba(255,160,40,0.7))"
                : "drop-shadow(0 0 6px rgba(255,140,40,0.35))",
        }}
        animate={
          reduceMotion
            ? undefined
            : attention
              ? { y: [0, -3, 0, 2.5, 0] }
              : processing
                ? { y: [0, -3.5, 0] }
                : { y: [0, -1.5, 0] }
        }
        transition={{
          duration: attention ? 1.2 : processing ? 2.4 : 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg viewBox="0 0 112 120" className="h-[120px] w-[112px]" aria-hidden>
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
                x1={56 + Math.cos(rad) * 23.5}
                y1={50 + Math.sin(rad) * 23.5}
                x2={56 + Math.cos(rad) * 25.5}
                y2={50 + Math.sin(rad) * 25.5}
                stroke="#1a1a1a"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })}

          <ellipse cx="46" cy="44" rx="7" ry="9" fill="#fff" stroke="#1a1a1a" strokeWidth="1.5" />
          <ellipse cx="66" cy="44" rx="7" ry="9" fill="#fff" stroke="#1a1a1a" strokeWidth="1.5" />

          <g transform={`translate(${pupilDx} 0)`}>
            <circle cx="46" cy="44" r="3.4" fill="#1a1a1a" />
            <circle cx="66" cy="44" r="3.4" fill="#1a1a1a" />
          </g>

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
          animate={
            reduceMotion
              ? undefined
              : { scale: attention || glowing ? [1, 1.2, 1] : [1, 1.08, 1] }
          }
          transition={{ duration: attention ? 0.7 : 0.9, repeat: Infinity }}
        >
          {String(activeCount).padStart(2, "0")}
        </motion.span>
      ) : null}
    </div>
  );
}
