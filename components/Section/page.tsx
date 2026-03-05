"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate } from "motion/react";
import Image from "next/image";

// ─── SECTION 1 — Collage dispersé ───────────────────────────────────────────

type ImageItem = {
  src: string;
  finalX: number;
  finalY: number;
  z: number;
  width: number;
  height: number;
  isLogo: boolean;
};

function createLogo(x: number, y: number, z: number, width: number, height: number): ImageItem {
  return { src: "/images/logo-2.png", finalX: x, finalY: y, z, width, height, isLogo: true };
}

const images: ImageItem[] = [
  { src: "/images/img-12.jpeg",       finalX: -484, finalY: -272, z: 1, width: 140, height: 185, isLogo: false },
  { src: "/images/img-2.jpg",         finalX:  -47, finalY: -281, z: 2, width: 148, height: 172, isLogo: false },
  { src: "/images/img-4.webp",        finalX:  391, finalY: -301, z: 3, width: 145, height: 205, isLogo: false },
  { src: "/images/img-section-1.jpg", finalX:  610, finalY:  134, z: 4, width: 135, height: 158, isLogo: false },
  { src: "/images/img-11.jpeg",       finalX: -263, finalY:  305, z: 3, width: 152, height: 155, isLogo: false },
  { src: "/images/img-13.jpeg",       finalX:  177, finalY:  286, z: 2, width: 150, height: 155, isLogo: false },
  createLogo(-237, -232, 5, 95, 95),
  createLogo( 154, -172, 6, 95, 95),
  createLogo( 599, -172, 6, 95, 95),
  createLogo(-471,  213, 5, 95, 95),
  createLogo( 366,  203, 6, 95, 95),
  createLogo( -20,  313, 7, 95, 95),
];

function useMouseSpring() {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 60, damping: 20, mass: 0.8 });
  const springY = useSpring(rawY, { stiffness: 60, damping: 20, mass: 0.8 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [rawX, rawY]);

  return { springX, springY };
}

type CollageItemProps = {
  img: ImageItem;
  index: number;
  isLoaderComplete: boolean;
  shouldDisperse: boolean;
  springX: ReturnType<typeof useSpring>;
  springY: ReturnType<typeof useSpring>;
};

function CollageItem({ img, index, isLoaderComplete, shouldDisperse, springX, springY }: CollageItemProps) {
  const { isLogo, z, finalX, finalY, width, height, src } = img;
  const parallaxStrength = isLogo ? 0.5 : (z / 6) * 20;

  const baseX = useMotionValue(isLogo ? finalX : index * 5);
  const baseY = useMotionValue(isLogo ? finalY : index * -5);

  useEffect(() => {
    if (!shouldDisperse) return;
    animate(baseX, finalX, { duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] });
    animate(baseY, finalY, { duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] });
  }, [shouldDisperse]); // eslint-disable-line

  const x = useTransform([baseX, springX], ([bx, sx]) => (bx as number) + (shouldDisperse ? (sx as number) * parallaxStrength : 0));
  const y = useTransform([baseY, springY], ([by, sy]) => (by as number) + (shouldDisperse ? (sy as number) * parallaxStrength : 0));

  return (
    <motion.div
      initial={{ opacity: 0, scale: isLogo ? 0.95 : 1, clipPath: isLogo ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 0% 0%)" }}
      animate={
        isLoaderComplete
          ? isLogo
            ? { opacity: shouldDisperse ? 1 : 0, scale: shouldDisperse ? 1 : 0.95, clipPath: shouldDisperse ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)" }
            : { opacity: 1 }
          : { opacity: 0 }
      }
      transition={
        isLogo
          ? { opacity: { duration: 0.9, delay: 0.7 }, scale: { duration: 0.9, delay: 0.7 }, clipPath: { duration: 1.2, delay: 0.7 } }
          : { opacity: { duration: 0.1, delay: index * 0.2 } }
      }
      style={{
        zIndex: z, position: "absolute", left: "50%", top: "50%",
        marginLeft: -width / 2, marginTop: -height / 2,
        width: `${width}px`, height: `${height}px`, x, y,
      }}
      className="overflow-hidden"
    >
      <Image src={src} alt={`Collage image ${index + 1}`} fill className="object-cover" sizes={`${width}px`} />
    </motion.div>
  );
}

function CollageSection({ counter, showScrollHint }: { counter: string; showScrollHint?: boolean }) {
  const [isLoaderComplete, setIsLoaderComplete] = useState(false);
  const [shouldDisperse, setShouldDisperse] = useState(false);
  const [isSectionActive, setIsSectionActive] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const { springX, springY } = useMouseSpring();

  useEffect(() => {
    const onLoaderComplete = () => { setIsLoaderComplete(true); setTimeout(() => setShouldDisperse(true), 900); };
    window.addEventListener("loaderComplete", onLoaderComplete);
    return () => window.removeEventListener("loaderComplete", onLoaderComplete);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setIsSectionActive(entry.isIntersecting), { threshold: 0.15 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const titleVisible = shouldDisperse && isSectionActive;
  const mobileImages = images.filter(img => !img.isLogo).slice(0, 3);

  return (
    <section ref={sectionRef} className="h-screen w-screen flex items-center justify-center bg-white text-black relative overflow-hidden">
      <p className="absolute top-7 left-8 lg:left-14 text-xs tracking-widest">Founded 1846 (Espagne)</p>
      <p className="absolute top-7 right-8 lg:right-14 text-xs tracking-widest">Case Study {counter}</p>

      {/* ── Desktop: title + collage ─────────────────────────────────────── */}
      <div className="hidden lg:block">
        <div className="absolute z-50 flex items-center gap-16" style={{ left: "18%", top: "35%" }}>
          <motion.div
            initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
            animate={!isSectionActive ? { clipPath: "inset(0 0 100% 0)" } : shouldDisperse ? { clipPath: "inset(0% 0% 0% 0%)" } : { clipPath: "inset(100% 0% 0% 0%)" }}
            transition={!isSectionActive ? { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } : { duration: 1.2, delay: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <motion.h1
              className="text-8xl font-light leading-none tracking-tight"
              initial={{ filter: "blur(18px)", opacity: 0 }}
              animate={titleVisible ? { filter: "blur(0px)", opacity: 1 } : { filter: "blur(18px)", opacity: 0 }}
              transition={titleVisible ? { duration: 1.4, delay: 1.5, ease: [0.25, 0.1, 0.25, 1] } : { duration: 0.4 }}
            >
              THE<br />LOEWE<br />ARCHIVE
            </motion.h1>
          </motion.div>
          <motion.p className="text-lg max-w-xs" initial={{ opacity: 0, y: 8 }}
            animate={titleVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={titleVisible ? { duration: 1, delay: 2.0, ease: [0.25, 0.1, 0.25, 1] } : { duration: 0.35 }}>
            Unfolding the legacy.<br />One era at a time.
          </motion.p>
        </div>
        <motion.div className="relative w-200 h-150 -translate-x-24"
          animate={{ opacity: isSectionActive ? 1 : 0 }} transition={{ duration: 0.5 }}>
          {images.map((img, index) => (
            <CollageItem key={`${img.src}-${index}`} img={img} index={index}
              isLoaderComplete={isLoaderComplete} shouldDisperse={shouldDisperse}
              springX={springX} springY={springY} />
          ))}
        </motion.div>
      </div>

      {/* ── Mobile: centered title + 3 images ───────────────────────────── */}
      <div className="lg:hidden flex flex-col items-center justify-center px-8 w-full text-center">
        <motion.h1 className="text-5xl sm:text-6xl font-light leading-none tracking-tight mb-6"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}>
          THE<br />LOEWE<br />ARCHIVE
        </motion.h1>
        <motion.p className="text-sm max-w-55 opacity-60 mb-10" initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }} transition={{ duration: 0.8, delay: 0.6 }}>
          Unfolding the legacy. One era at a time.
        </motion.p>
        <div className="flex gap-3">
          {mobileImages.map((img, i) => (
            <motion.div key={i} className="relative overflow-hidden" style={{ width: 90, height: 120 }}
              initial={{ clipPath: "inset(100% 0 0 0)" }} animate={{ clipPath: "inset(0% 0 0 0)" }}
              transition={{ duration: 0.9, delay: 0.5 + i * 0.15, ease: [0.25, 0.1, 0.25, 1] }}>
              <Image src={img.src} alt="" fill className="object-cover" sizes="90px" />
            </motion.div>
          ))}
        </div>
      </div>

      {showScrollHint && <p className="absolute bottom-7 left-8 lg:left-14 text-xs tracking-widest">Scroll to view more</p>}
      <p className="absolute bottom-7 right-8 lg:right-14 text-xs tracking-widest">By Marvin SABIN</p>
    </section>
  );
}

export function Section1() {
  return <CollageSection counter="(01)" showScrollHint />;
}

// ─── SECTION 2–4 — Film strip gallery ───────────────────────────────────────

type GalleryItem = {
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
  label?: string;
  description?: string;
};

const DESCRIPTIONS: Record<string, string> = {
  default: "The archive holds what time softens — a quiet gesture, a cloth cut against the light.",
  second:  "Form without apology. Each silhouette drawn from the tension between craft and concept.",
  third:   "Something older than fashion. A sensibility that refuses to be hurried.",
  fourth:  "In the hand of Jonathan Anderson, the past is never nostalgia — it is material.",
};

// ─── EXPAND VIEW ─────────────────────────────────────────────────────────────

type ExpandState = { item: GalleryItem; rect: DOMRect };

function ExpandView({ state, onClose }: { state: ExpandState; onClose: () => void }) {
  const { item, rect } = state;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const portal = (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black z-9998"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.88 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        onClick={onClose}
      />

      {/* Image expanding from its original position */}
      <motion.div
        className="fixed z-9999 overflow-hidden"
        initial={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        animate={{ left: 0, top: 0, width: "100vw", height: "100vh" }}
        exit={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        transition={{ duration: 0.62, ease: [0.76, 0, 0.24, 1] }}
      >
        <Image src={item.src} alt={item.label ?? ""} fill className="object-contain" sizes="100vw" priority />

        {/* Info overlay — fades in after expand */}
        <motion.div
          className="absolute inset-0 flex flex-col justify-between pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
        >
          {/* Top gradient + info */}
          <div className="px-10 pt-10 lg:px-14 lg:pt-14 pb-20" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)" }}>
            {item.label && (
              <p className="text-white text-sm tracking-widest uppercase mb-1">{item.label}</p>
            )}
            <p className="text-white text-xs tracking-widest opacity-50">@loewe</p>
          </div>
          {/* Bottom gradient + description */}
          <div className="px-10 pb-10 lg:px-14 lg:pb-14 pt-20" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)" }}>
            <p className="text-white text-xs leading-relaxed opacity-70 max-w-xs">
              {item.description ?? DESCRIPTIONS.default}
            </p>
          </div>
        </motion.div>

        {/* Close */}
        <motion.button
          className="absolute top-8 right-10 lg:right-14 text-white text-xs tracking-widest opacity-50 hover:opacity-100 transition-opacity pointer-events-auto cursor-pointer drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
          onClick={onClose}
        >
          Close
        </motion.button>
      </motion.div>
    </>
  );

  return createPortal(portal, document.body);
}

// ─── GALLERY SECTION ─────────────────────────────────────────────────────────

function GallerySection({ items, counter }: { items: GalleryItem[]; counter: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [expandState, setExpandState] = useState<ExpandState | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleClick = useCallback((item: GalleryItem, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setExpandState({ item, rect });
  }, []);

  return (
    <section ref={sectionRef} className="h-screen w-screen bg-white text-black relative overflow-hidden">

      {/* ── Mobile: scrollable grid ───────────────────────────────────────── */}
      <div className="lg:hidden h-full overflow-y-auto">
        <p className="px-6 pt-8 pb-5 text-xs tracking-widest opacity-50">{counter}</p>
        <div className="grid grid-cols-2 gap-2 px-4 pb-10">
          {items.map((item, i) => (
            <motion.div key={i} className="relative overflow-hidden cursor-pointer"
              style={{ aspectRatio: `${item.width / item.height}` }}
              onClick={(e) => handleClick(item, e)}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, delay: i * 0.07, ease: [0.25, 0.1, 0.25, 1] }}>
              <Image src={item.src} alt={item.label ?? `Gallery item ${i + 1}`} fill className="object-cover" sizes="50vw" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Desktop: film strip layout ────────────────────────────────────── */}
      <div className="hidden lg:block relative w-full h-full">
        {items.map((item, i) => (
          <motion.div
            key={i}
            className="absolute overflow-hidden group"
            style={{ left: item.left, top: item.top, width: item.width, height: item.height, cursor: "crosshair" }}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.05 }}
            transition={
              isVisible
                ? { duration: 1, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] }
                : { duration: 0.4, ease: "easeIn" }
            }
            onClick={(e) => handleClick(item, e)}
          >
            {/* Image with inner scale on hover */}
            <motion.div
              className="w-full h-full"
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Image
                src={item.src}
                alt={item.label ?? `Gallery item ${i + 1}`}
                fill
                className="object-cover"
                sizes={`${item.width}px`}
              />
            </motion.div>

            {/* Hover label */}
            {item.label && (
              <motion.div
                className="absolute bottom-3 left-3 text-white text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
              >
                {item.label}
              </motion.div>
            )}
          </motion.div>
        ))}

        <motion.p
          className="absolute bottom-7 right-14 text-xs tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.6, delay: isVisible ? 0.6 : 0 }}
        >
          {counter}
        </motion.p>
      </div>

      <AnimatePresence>
        {expandState && (
          <ExpandView state={expandState} onClose={() => setExpandState(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── DATA — film strip positions (spacious, cinematic) ───────────────────────

// Section 2 — (01/03)
const section2Items: GalleryItem[] = [
  { src: "/images/img-1.jpg",      left:  60, top:  80, width: 340, height: 500, label: "Archive I",    description: DESCRIPTIONS.default },
  { src: "/images/img-5.jpg",      left: 480, top:  60, width: 440, height: 280, label: "Winter 22",    description: DESCRIPTIONS.second },
  { src: "/images/img-10.jpeg",    left: 480, top: 400, width: 220, height: 320, label: "Collection",   description: DESCRIPTIONS.third },
  { src: "/images/img-hero-2.jpg", left: 800, top: 200, width: 500, height: 360, label: "Dispatch",     description: DESCRIPTIONS.fourth },
  { src: "/images/img-3.jpg",      left: 1330, top: 90, width: 160, height: 240, label: "Blasy",        description: DESCRIPTIONS.default },
];

// Section 3 (used by Section3 export, 02/03)
const section4Items: GalleryItem[] = [
  { src: "/images/img-8.jpeg",        left:  80, top: 120, width: 280, height: 420, label: "Archive II",   description: DESCRIPTIONS.third },
  { src: "/images/img-14.jpeg",       left: 450, top:  60, width: 520, height: 320, label: "Editorial",    description: DESCRIPTIONS.fourth },
  { src: "/images/img-2.jpg",         left: 450, top: 440, width: 240, height: 340, label: "Craft",        description: DESCRIPTIONS.default },
  { src: "/images/img-section-1.jpg", left: 1020, top: 180, width: 360, height: 500, label: "Heritage",   description: DESCRIPTIONS.second },
  { src: "/images/video-2.gif",       left: 1270, top:  70, width: 160, height: 130, label: "Motion",     description: DESCRIPTIONS.third },
];

// Section 4 (used by Section4 export, 03/03)
const section3Items: GalleryItem[] = [
  { src: "/images/img-9.jpeg",     left:  60, top:  60, width: 480, height: 340, label: "Chapter III",  description: DESCRIPTIONS.second },
  { src: "/images/img-12.jpeg",    left:  80, top: 460, width: 260, height: 380, label: "Silhouette",   description: DESCRIPTIONS.fourth },
  { src: "/images/img-4.webp",     left: 620, top: 130, width: 340, height: 500, label: "Form",         description: DESCRIPTIONS.third },
  { src: "/images/img-11.jpeg",    left: 1040, top:  80, width: 380, height: 260, label: "Legacy",      description: DESCRIPTIONS.default },
  { src: "/images/img-5.jpg",      left: 1060, top: 410, width: 240, height: 360, label: "Memory",      description: DESCRIPTIONS.second },
];

export function Section2() {
  return <GallerySection items={section2Items} counter="(01 / 03)" />;
}

export function Section3() {
  return <GallerySection items={section4Items} counter="(02 / 03)" />;
}

export function Section4() {
  return <GallerySection items={section3Items} counter="(03 / 03)" />;
}
