import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUpRight, Moon, Sun } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface StethoscopeScrollHeroProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onEnterDemo: () => void;
  onOpenEmergency: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

interface FrameManifest {
  'stethoscope-scroll'?: {
    frames: number;
    fps: number;
    path: string;
    ext: string;
    fallbackVideo?: string;
  };
}

const DEFAULT_FRAME_COUNT = 373;
const DEFAULT_FRAME_PATH = '/frames/stethoscope-scroll/frame_';
const DEFAULT_FRAME_EXT = '.webp';

function formatFrameUrl(pathPrefix: string, index: number, ext: string): string {
  const num = String(index + 1).padStart(4, '0');
  return `${pathPrefix}${num}${ext}`;
}

export const StethoscopeScrollHero: React.FC<StethoscopeScrollHeroProps> = ({
  onGetStarted,
  onLogin,
  onEnterDemo,
  onOpenEmergency,
  theme,
  onToggleTheme
}) => {
  const shouldReduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const act1Ref = useRef<HTMLDivElement | null>(null);
  const act2Ref = useRef<HTMLDivElement | null>(null);
  const act3Ref = useRef<HTMLDivElement | null>(null);

  const [activeAct, setActiveAct] = useState<1 | 2 | 3>(1);
  const [firstFrameReady, setFirstFrameReady] = useState(false);

  const framesRef = useRef<(HTMLImageElement | null)[]>([]);
  const totalFramesRef = useRef<number>(DEFAULT_FRAME_COUNT);
  const targetFrameRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);
  const lastDrawnFrameRef = useRef<number>(-1);
  const activeActRef = useRef<1 | 2 | 3>(1);

  // Draw a specific frame onto the DPR-scaled canvas with subtle corner overscan
  const drawFrame = (frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frames = framesRef.current;
    let img = frames[frameIdx];

    // Fallback to nearest loaded frame if user scrubs quickly ahead of preload
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let offset = 1; offset < 40; offset++) {
        const lower = frames[frameIdx - offset];
        if (lower && lower.complete && lower.naturalWidth > 0) {
          img = lower;
          break;
        }
        const upper = frames[frameIdx + offset];
        if (upper && upper.complete && upper.naturalWidth > 0) {
          img = upper;
          break;
        }
      }
      if (!img || !img.complete || img.naturalWidth === 0) {
        img = frames[0];
      }
    }
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (cssW === 0 || cssH === 0) return;

    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const viewRatio = cssW / cssH;
    const isPortrait = viewRatio < 1;

    let drawW: number;
    let drawH: number;
    let drawX: number;
    let drawY: number;

    if (isPortrait) {
      // On narrow mobile portrait screens, keep the entire stethoscope visible horizontally
      // while feathering the top/bottom frame edges seamlessly into the surrounding studio canvas.
      drawW = cssW * 1.08;
      drawH = drawW / imgRatio;
      drawX = (cssW - drawW) / 2 - cssW * 0.015;
      drawY = cssH * 0.39 - drawH / 2;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      const feather = ctx.createLinearGradient(0, drawY, 0, drawY + drawH);
      feather.addColorStop(0, 'rgba(0,0,0,0)');
      feather.addColorStop(0.22, 'rgba(0,0,0,1)');
      feather.addColorStop(0.78, 'rgba(0,0,0,1)');
      feather.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = feather;
      ctx.fillRect(0, drawY - 1, cssW, drawH + 2);
      ctx.restore();
    } else {
      // On desktop/tablet landscape, fill edge-to-edge with 4.5% overscan shifted slightly
      // up-left so the outer perimeter stays completely clean and edge-free.
      if (viewRatio > imgRatio) {
        drawW = cssW * 1.05;
        drawH = drawW / imgRatio;
      } else {
        drawH = cssH * 1.05;
        drawW = drawH * imgRatio;
      }
      drawX = (cssW - drawW) / 2 - cssW * 0.015;
      drawY = (cssH - drawH) / 2 - cssH * 0.03;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }
  };

  // Progressive frame preloader (frame 0 -> keyframes -> all frames in parallel batches)
  useEffect(() => {
    let cancelled = false;

    const loadImage = (url: string, idx: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          if (!cancelled) {
            framesRef.current[idx] = img;
            if (idx === 0) {
              setFirstFrameReady(true);
              drawFrame(0);
            }
          }
          resolve();
        };
        img.onerror = () => resolve();
        img.src = url;
      });

    const preloadAll = async () => {
      let frameCount = DEFAULT_FRAME_COUNT;
      let pathPrefix = DEFAULT_FRAME_PATH;
      let ext = DEFAULT_FRAME_EXT;

      try {
        const res = await fetch('/frames/manifest.json');
        if (res.ok) {
          const manifest = (await res.json()) as FrameManifest;
          const entry = manifest['stethoscope-scroll'];
          if (entry && entry.frames > 0) {
            frameCount = entry.frames;
            pathPrefix = entry.path;
            ext = entry.ext;
          }
        }
      } catch {
        // Use defaults if manifest fetch fails
      }

      if (cancelled) return;
      totalFramesRef.current = frameCount;
      framesRef.current = new Array<HTMLImageElement | null>(frameCount).fill(null);

      // Load first frame immediately for instant first paint
      await loadImage(formatFrameUrl(pathPrefix, 0, ext), 0);
      if (cancelled || shouldReduceMotion) return;

      // Keyframes every 8th frame first for responsive immediate scrubbing
      const keyframeIndices: number[] = [];
      const remainingIndices: number[] = [];
      for (let i = 1; i < frameCount; i++) {
        if (i % 8 === 0) keyframeIndices.push(i);
        else remainingIndices.push(i);
      }

      const loadInBatches = async (indices: number[], batchSize: number) => {
        for (let i = 0; i < indices.length; i += batchSize) {
          if (cancelled) return;
          const slice = indices.slice(i, i + batchSize);
          await Promise.all(
            slice.map((idx) => loadImage(formatFrameUrl(pathPrefix, idx, ext), idx))
          );
        }
      };

      await loadInBatches(keyframeIndices, 8);
      await loadInBatches(remainingIndices, 10);
    };

    preloadAll();

    const handleResize = () => {
      drawFrame(Math.round(currentFrameRef.current));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
    };
  }, [shouldReduceMotion]);

  // GSAP ScrollTrigger pinning + 3-Act Choreography + RAF frame lerping
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    if (shouldReduceMotion) {
      drawFrame(0);
      return;
    }

    let rafId = 0;
    let mounted = true;

    const renderLoop = () => {
      if (!mounted) return;
      const diff = targetFrameRef.current - currentFrameRef.current;
      if (Math.abs(diff) > 0.05) {
        currentFrameRef.current += diff * 0.16;
      } else {
        currentFrameRef.current = targetFrameRef.current;
      }
      const rounded = Math.max(
        0,
        Math.min(totalFramesRef.current - 1, Math.round(currentFrameRef.current))
      );
      if (rounded !== lastDrawnFrameRef.current) {
        lastDrawnFrameRef.current = rounded;
        drawFrame(rounded);
      }
      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);

    const ctx = gsap.context(() => {
      // Initial resting states for Acts II & III
      if (act1Ref.current) gsap.set(act1Ref.current, { opacity: 1, y: 0, filter: 'blur(0px)' });
      if (act2Ref.current) gsap.set(act2Ref.current, { opacity: 0, y: 24, filter: 'blur(4px)' });
      if (act3Ref.current) gsap.set(act3Ref.current, { opacity: 0, y: 22, filter: 'blur(4px)' });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: '+=220%',
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const maxIdx = Math.max(1, totalFramesRef.current - 1);
            targetFrameRef.current = self.progress * maxIdx;

            const nextAct: 1 | 2 | 3 =
              self.progress < 0.32 ? 1 : self.progress < 0.68 ? 2 : 3;
            if (nextAct !== activeActRef.current) {
              activeActRef.current = nextAct;
              setActiveAct(nextAct);
            }
          }
        }
      });

      // Timeline normalized 0 -> 1 across the pinned scroll track
      tl.to(
        act1Ref.current,
        {
          opacity: 0,
          y: -28,
          filter: 'blur(4px)',
          duration: 0.11,
          ease: 'power2.inOut'
        },
        0.22
      )
        .to(
          act2Ref.current,
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.1,
            ease: 'power2.out'
          },
          0.34
        )
        .to(
          act2Ref.current,
          {
            opacity: 0,
            y: -24,
            filter: 'blur(4px)',
            duration: 0.09,
            ease: 'power2.in'
          },
          0.59
        )
        .to(
          act3Ref.current,
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.12,
            ease: 'power2.out'
          },
          0.70
        )
        .to({}, { duration: 0.18 }, 0.82);
    }, stage);

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      ctx.revert();
    };
  }, [shouldReduceMotion]);

  return (
    <section
      ref={stageRef}
      aria-label="HealYaar introduction"
      className="relative w-full h-[100svh] overflow-x-clip bg-gradient-to-b from-[#CBD1D8] via-[#E2E6EB] to-[#D1D6DC] dark:from-[#090D14] dark:via-[#111827] dark:to-[#090D14] select-none"
    >
      {/* Instant-paint studio fallback frame before canvas initializes */}
      {!firstFrameReady && (
        <img
          src="/frames/stethoscope-scroll/frame_0001.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-contain md:object-cover object-center scale-[1.05] pointer-events-none dark:brightness-[0.65] dark:contrast-[1.08]"
        />
      )}

      {/* Full-Bleed Hardware-Accelerated Scroll Canvas */}
      <canvas
        ref={canvasRef}
        aria-label="Precision brushed-titanium medical stethoscope rotating in a bright clinical studio"
        className="absolute inset-0 w-full h-full pointer-events-none dark:brightness-[0.68] dark:contrast-[1.08] transition-[filter] duration-300"
        style={{
          WebkitMaskImage:
            'radial-gradient(ellipse 92% 72% at 50% 45%, black 52%, transparent 98%)',
          maskImage:
            'radial-gradient(ellipse 92% 72% at 50% 45%, black 52%, transparent 98%)'
        }}
      />

      {/* Soft daylight & dark-mode atmospheric readability scrims at perimeter */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#CBD1D8]/75 to-transparent dark:from-[#090D14]/90"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-72 sm:h-64 bg-gradient-to-t from-[#CBD1D8]/95 via-[#D7DCE2]/70 to-transparent dark:from-[#090D14] dark:via-[#090D14]/80"
      />

      {/* Persistent Minimal Studio Header */}
      <header className="relative z-30 max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-10 pt-5 sm:pt-7 flex items-center justify-between gap-4">
        <a
          href="#top"
          aria-label="HealYaar home"
          className="inline-flex items-center gap-2.5 focus-visible:outline-none rounded-lg"
        >
          <img
            src="/logo.png"
            alt="HealYaar"
            className="h-7 sm:h-8 w-auto object-contain"
          />
        </a>

        <div className="flex items-center gap-2 sm:gap-5">
          <nav
            aria-label="Primary landing navigation"
            className="hidden md:flex items-center gap-6 font-body text-sm font-medium text-[#0F172A]/80 dark:text-[#F8FAFC]/85"
          >
            <a
              href="#workspace-preview"
              className="hover:text-[#0F766E] dark:hover:text-[#2DD4BF] transition-colors"
            >
              Preview
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#0F766E] dark:hover:text-[#2DD4BF] transition-colors"
            >
              How it works
            </a>
            <a
              href="#features"
              className="hover:text-[#0F766E] dark:hover:text-[#2DD4BF] transition-colors"
            >
              Features
            </a>
            <button
              type="button"
              onClick={onEnterDemo}
              className="hover:text-[#0F766E] dark:hover:text-[#2DD4BF] transition-colors cursor-pointer"
            >
              Live demo
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              onClick={onLogin}
              className="px-3.5 py-2 rounded-[10px] squircle font-body text-xs sm:text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors whitespace-nowrap cursor-pointer"
            >
              Log in
            </motion.button>

            <motion.button
              type="button"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-10 h-10 rounded-[10px] squircle border border-black/[0.08] dark:border-white/[0.12] bg-white/75 dark:bg-[#111827]/80 backdrop-blur-sm text-[#0F172A] dark:text-[#F8FAFC] hover:bg-white dark:hover:bg-[#1E293B] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4" aria-hidden="true" />
              )}
            </motion.button>

            <motion.button
              type="button"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              onClick={onOpenEmergency}
              className="px-3.5 py-2 rounded-[10px] squircle bg-[#BE123C] hover:bg-[#9F1239] text-white font-body text-xs sm:text-sm font-semibold tracking-tight whitespace-nowrap transition-colors shrink-0 cursor-pointer"
            >
              SOS 108/112
            </motion.button>
          </div>
        </div>
      </header>

      {/* Scroll-Choreographed 3-Act Editorial Overlay Stage */}
      <div className="pointer-events-none absolute inset-0 z-20 max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-10 flex flex-col justify-end pb-36 sm:pb-12">
        {/* ACT I (0% - 32%): Opening Headline + Primary CTAs (anchored bottom-left so bottom-right cookie banner never overlaps) */}
        <div
          ref={act1Ref}
          aria-hidden={!shouldReduceMotion && activeAct !== 1}
          className={`max-w-xl space-y-3.5 sm:space-y-4 ${
            shouldReduceMotion || activeAct === 1 ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          <h1 className="font-display font-bold tracking-[-0.03em] text-[#0F172A] dark:text-[#F8FAFC] text-[clamp(2.15rem,4.1vw,3.75rem)] leading-[1.04] max-w-[14ch]">
            Healthcare you can actually understand.
          </h1>

          <p className="font-body text-sm sm:text-base text-[#1E293B] dark:text-[#E2E8F0] leading-relaxed max-w-[42ch]">
            Private AI for lab reports, prescriptions, and doctor prep — in English,{' '}
            <span className="font-devanagari">हिन्दी</span>, and{' '}
            <span className="font-devanagari">मराठी</span>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <motion.button
              type="button"
              whileHover={shouldReduceMotion ? undefined : { y: -1 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[12px] squircle bg-[#0F766E] hover:bg-[#0D9488] text-white font-body text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <span>Get started free</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </motion.button>

            <motion.button
              type="button"
              whileHover={shouldReduceMotion ? undefined : { y: -1 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              onClick={onEnterDemo}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-[12px] squircle border border-black/[0.14] dark:border-white/[0.2] bg-white/85 dark:bg-[#111827]/85 backdrop-blur-sm hover:bg-white dark:hover:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-body text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
            >
              <span>Try live demo</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </motion.button>
          </div>
        </div>

        {/* ACT II (33% - 68%): Macro Chestpiece Focus + Dual-Layer RAG Clarity */}
        {!shouldReduceMotion && (
          <div
            ref={act2Ref}
            aria-hidden={activeAct !== 2}
            className="absolute inset-x-5 sm:inset-x-8 lg:inset-x-10 bottom-36 sm:bottom-14 max-w-xl"
          >
            <h2 className="font-display font-semibold tracking-[-0.025em] text-[#0F172A] dark:text-[#F8FAFC] text-[clamp(1.75rem,3.6vw,3rem)] leading-[1.08]">
              Every report and prescription, translated into plain clarity.
            </h2>
            <p className="font-body text-sm sm:text-base text-[#1E293B] dark:text-[#E2E8F0] leading-relaxed mt-3 max-w-[44ch]">
              Dual-Layer RAG grounds every explanation in your personal vault alongside WHO and ICMR-NIN clinical references — never generic guesswork.
            </p>
          </div>
        )}

        {/* ACT III (68% - 100%): Elevated Full Stethoscope Settle + Centered CTA */}
        {!shouldReduceMotion && (
          <div
            ref={act3Ref}
            aria-hidden={activeAct !== 3}
            className={`absolute inset-x-5 sm:inset-x-8 lg:inset-x-10 bottom-36 sm:bottom-12 flex flex-col items-center text-center ${
              activeAct === 3 ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
          >
            <h2 className="font-display font-semibold tracking-[-0.025em] text-[#0F172A] dark:text-[#F8FAFC] text-[clamp(1.75rem,3.6vw,3rem)] leading-[1.08] max-w-[24ch]">
              Private by architecture. Built for every generation.
            </h2>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[12px] squircle bg-[#0F766E] hover:bg-[#0D9488] text-white font-body text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Open your private vault</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={onEnterDemo}
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-[12px] squircle border border-black/[0.14] dark:border-white/[0.2] bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm hover:bg-white dark:hover:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] font-body text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Explore live demo</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
