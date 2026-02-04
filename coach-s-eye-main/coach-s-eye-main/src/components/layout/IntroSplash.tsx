import { useEffect, useRef, useState } from "react";
import type React from "react";
import valorantThemeImg from "@/asset/players/valorant_theme_image.jpg";

interface IntroSplashProps {
  onFinish: () => void;
}

/**
 * Fullscreen intro splash with animated loading ring and optional game music.
 * Keeps things lightweight: timed auto-dismiss + optional "Enter dashboard" button.
 */
const IntroSplash = ({ onFinish }: IntroSplashProps) => {
  const [progress, setProgress] = useState(0);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const start = performance.now();
    const duration = 3800; // ~3.8s fill for a slower intro

    const step = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (elapsed < duration) {
        requestAnimationFrame(step);
      } else {
        // small delay then finish
        setTimeout(onFinish, 600);
      }
    };

    const id = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(id);
      // Ensure music stops when splash unmounts
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [onFinish]);

  const handleToggleMusic: React.MouseEventHandler<HTMLButtonElement> = () => {
    if (!musicEnabled) {
      // Lazily create audio instance on user interaction to satisfy autoplay rules.
      if (!audioRef.current) {
        audioRef.current = new Audio("/audio/stratiq-theme.mp3");
        audioRef.current.loop = true;
        audioRef.current.volume = 0.6;
      }
      audioRef.current
        .play()
        .then(() => setMusicEnabled(true))
        .catch(() => {
          // ignore play errors (e.g. blocked by browser)
        });
    } else {
      audioRef.current?.pause();
      setMusicEnabled(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#020617] to-[#0b1120] overflow-hidden">
      {/* Background hero artwork using provided Valorant theme image */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-25 mix-blend-screen hidden md:block"
          style={{
            backgroundImage: `url(${valorantThemeImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
        />
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-6 text-center px-4">
        {/* Animated loading ring */}
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="rgba(30,64,175,0.45)"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="url(#introRingGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              className="intro-ring-progress"
            />
            <defs>
              <linearGradient id="introRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#facc15" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Loading
            </span>
            <span className="text-2xl font-bold text-white mt-1">{progress}%</span>
          </div>
        </div>

        {/* Brand + copy */}
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
            StratIQ
          </p>
          <h1 className="text-xl font-bold gradient-text">Assistant Coach Online</h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Warming up dashboards, syncing match stats, and queuing your coaching
            insights.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-400">
          <button
            type="button"
            onClick={handleToggleMusic}
            className={`px-3 py-1.5 rounded-full border text-[11px] flex items-center gap-1.5 transition ${
              musicEnabled
                ? "border-emerald-400/70 bg-emerald-500/10 text-emerald-200"
                : "border-slate-600/70 bg-black/30 hover:border-cyan-400 hover:text-cyan-200"
            }`}
          >
            <span>{musicEnabled ? "🔊" : "🎧"}</span>
            <span>{musicEnabled ? "Music on" : "Enable game theme"}</span>
          </button>
          <span className="hidden sm:inline text-[11px] text-slate-500">
            You can toggle music on/off anytime while the intro is visible.
          </span>
        </div>
      </div>
    </div>
  );
};

export default IntroSplash;

