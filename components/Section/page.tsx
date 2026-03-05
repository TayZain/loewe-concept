"use client";
import { useEffect, useRef, useState } from "react";
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
      initial={{
        opacity: 0,
        scale: isLogo ? 0.95 : 1,
        clipPath: isLogo ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 0% 0%)",
      }}
      animate={
        isLoaderComplete
          ? isLogo
            ? {
              opacity: shouldDisperse ? 1 : 0,
              scale: shouldDisperse ? 1 : 0.95,
              clipPath: shouldDisperse ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
            }
            : { opacity: 1 }
          : { opacity: 0 }
      }
      transition={
        isLogo
          ? {
            opacity:  { duration: 0.8, delay: 1.5, ease: "easeOut" },
            scale:    { duration: 0.8, delay: 1.5, ease: [0.16, 1, 0.3, 1] },
            clipPath: { duration: 1.2, delay: 1.5, ease: [0.25, 0.1, 0.25, 1] },
          }
          : {
            opacity: { duration: 0.1, delay: index * 0.2, ease: "linear" },
          }
      }
      style={{
        zIndex: z,
        position: "absolute",
        left: "50%",
        top: "50%",
        marginLeft: -width / 2,
        marginTop: -height / 2,
        width: `${width}px`,
        height: `${height}px`,
        x,
        y,
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
    const onLoaderComplete = () => {
      setIsLoaderComplete(true);
      setTimeout(() => setShouldDisperse(true), 1500);
    };
    window.addEventListener("loaderComplete", onLoaderComplete);
    return () => window.removeEventListener("loaderComplete", onLoaderComplete);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsSectionActive(entry.isIntersecting),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const titleVisible = shouldDisperse && isSectionActive;
  const mobileImages = images.filter(img => !img.isLogo).slice(0, 3);

  return (
    <section ref={sectionRef} className="h-screen w-screen flex items-center justify-center bg-white text-black relative overflow-hidden">
      <p className="absolute top-7 left-8 lg:left-14 text-xs tracking-widest">Founded 1846 (Espagne)</p>
      <p className="absolute top-7 right-8 lg:right-14 text-xs tracking-widest">Gallery { counter}</p>

      {/* ── Desktop: title + collage ─────────────────────────────────────── */}
      <div className="hidden lg:block">
        <div className="absolute z-50 flex items-center gap-16" style={{ left: "18%", top: "35%" }}>
          <motion.div
            initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
            animate={
              !isSectionActive
                ? { clipPath: "inset(0 0 100% 0)" }
                : shouldDisperse
                  ? { clipPath: "inset(0% 0% 0% 0%)" }
                  : { clipPath: "inset(100% 0% 0% 0%)" }
            }
            transition={
              !isSectionActive
                ? { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }
                : { duration: 1.2, delay: 2.1, ease: [0.25, 0.1, 0.25, 1] }
            }
          >
            <motion.h1
              className="text-8xl font-light leading-none tracking-tight"
              initial={{ filter: "blur(18px)", opacity: 0 }}
              animate={titleVisible ? { filter: "blur(0px)", opacity: 1 } : { filter: "blur(18px)", opacity: 0 }}
              transition={
                titleVisible
                  ? { duration: 1.4, delay: 2.2, ease: [0.25, 0.1, 0.25, 1] }
                  : { duration: 0.4, ease: "easeIn" }
              }
            >
              THE<br />LOEWE<br />ARCHIVE
            </motion.h1>
          </motion.div>

          <motion.p
            className="text-lg max-w-xs"
            initial={{ opacity: 0, y: 8 }}
            animate={titleVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={
              titleVisible
                ? { duration: 1, delay: 2.6, ease: [0.25, 0.1, 0.25, 1] }
                : { duration: 0.35, ease: "easeIn" }
            }
          >
            Unfolding the legacy.<br />One era at a time.
          </motion.p>
        </div>

        <motion.div
          className="relative w-200 h-150 -translate-x-24"
          animate={{ opacity: isSectionActive ? 1 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {images.map((img, index) => (
            <CollageItem
              key={`${img.src}-${index}`}
              img={img}
              index={index}
              isLoaderComplete={isLoaderComplete}
              shouldDisperse={shouldDisperse}
              springX={springX}
              springY={springY}
            />
          ))}
        </motion.div>
      </div>

      {/* ── Mobile: centered title + 3 images ───────────────────────────── */}
      <div className="lg:hidden flex flex-col items-center justify-center px-8 w-full text-center">
        <motion.h1
          className="text-5xl sm:text-6xl font-light leading-none tracking-tight mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          THE<br />LOEWE<br />ARCHIVE
        </motion.h1>

        <motion.p
          className="text-sm max-w-55 opacity-60 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Unfolding the legacy. One era at a time.
        </motion.p>

        <div className="flex gap-3">
          {mobileImages.map((img, i) => (
            <motion.div
              key={i}
              className="relative overflow-hidden"
              style={{ width: 90, height: 120 }}
              initial={{ clipPath: "inset(100% 0 0 0)" }}
              animate={{ clipPath: "inset(0% 0 0 0)" }}
              transition={{ duration: 0.9, delay: 0.5 + i * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Image src={img.src} alt="" fill className="object-cover" sizes="90px" />
            </motion.div>
          ))}
        </div>
      </div>

      {showScrollHint && (
        <p className="absolute bottom-7 left-8 lg:left-14 text-xs tracking-widest">Scroll to view more</p>
      )}
      <p className="absolute bottom-7 right-8 lg:right-14 text-xs tracking-widest">By Marvin SABIN</p>
    </section>
  );
}

export function Section1() {
  return <CollageSection counter="(01)" showScrollHint />;
}

// ─── SECTION 2–4 — Galerie éditoriale ───────────────────────────────────────

type GalleryItem = {
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
  label?: string[];
  labelPosition?: "left" | "above" | "below";
  expandable?: boolean;
  description?: string;
};

const LABEL = ["Blasy", "Winter (22)", "Collection"];

const DESCRIPTIONS: Record<string, string> = {
  default: "The archive holds what time softens — a quiet gesture, a cloth cut against the light.",
  second: "Form without apology. Each silhouette drawn from the tension between craft and concept.",
  third: "Something older than fashion. A sensibility that refuses to be hurried.",
  fourth: "In the hand of Jonathan Anderson, the past is never nostalgia — it is material.",
};

function GalleryLabel({ lines, visible, delay }: { lines: string[]; visible: boolean; delay: number }) {
  return (
    <motion.div
      className="leading-snug overflow-hidden"
      style={{ fontSize: 11 }}
      initial={{ opacity: 0, y: 6 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
      transition={
        visible
          ? { duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] }
          : { duration: 0.4, delay: 0, ease: "easeIn" }
      }
    >
      {lines.map((line, i) => <span key={i} className="block">{line}</span>)}
    </motion.div>
  );
}

// ─── DETAIL VIEW (Portal) ────────────────────────────────────────────────────

type DetailViewProps = {
  items: GalleryItem[];
  initialIndex: number;
  onClose: () => void;
};

function DetailView({ items, initialIndex, onClose }: DetailViewProps) {
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(1);
  const item = items[index];

  const goNext = () => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % items.length);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown" || e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // eslint-disable-line

  const label = item.label ? item.label[0] : `Image ${index + 1}`;
  const desc = item.description ?? DESCRIPTIONS.default;
  const num = String(index + 1).padStart(2, "0");

  const portal = (
    <motion.div
      className="fixed inset-0 z-9999 bg-white text-black flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-8 lg:px-14 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`header-${index}`}
            initial={{ opacity: 0, y: 8, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <p className="text-xs tracking-widest mb-1 text-black">No.{num}</p>
            <p className="text-sm tracking-widest uppercase text-black">{label}</p>
          </motion.div>
        </AnimatePresence>

        <button
          onClick={onClose}
          className="text-lg cursor-pointer leading-none tracking-widest text-black opacity-60 hover:opacity-100 transition-opacity"
          style={{ fontWeight: 300 }}
        >
          Close
        </button>
      </div>

      {/* Main image */}
      <div className="flex-1 flex items-center justify-center px-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0, y: direction * 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction * -30 }}
            transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full max-w-115"
            style={{ height: "clamp(240px, 50vh, 400px)" }}
          >
            <Image
              src={item.src}
              alt={label}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 90vw, 460px"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-end justify-between px-8 lg:px-14 pb-10">
        <div>
          <button
            onClick={goNext}
            className="flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Next image"
          >
            <span className="text-xs tracking-widest">
              {String(index + 2 > items.length ? 1 : index + 2).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </span>
            <span className="text-xl leading-none" style={{ fontWeight: 200 }}>↓</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`footer-${index}`}
            className="text-right max-w-50 lg:max-w-65"
            initial={{ opacity: 0, y: 6, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(8px)" }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <p className="text-xs tracking-widest mb-2 text-black opacity-40">@loewe</p>
            <p className="text-xs leading-relaxed text-black opacity-70">{desc}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );

  return createPortal(portal, document.body);
}

// ─── GALLERY SECTION ─────────────────────────────────────────────────────────

function GallerySection({ items, counter }: { items: GalleryItem[]; counter: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="h-screen w-screen bg-white text-black relative overflow-hidden">

      {/* ── Mobile: scrollable 2-col grid ─────────────────────────────────── */}
      <div className="lg:hidden h-full overflow-y-auto">
        <p className="px-6 pt-8 pb-5 text-xs tracking-widest opacity-50">{counter}</p>
        <div className="grid grid-cols-2 gap-2 px-4 pb-10">
          {items.map((item, i) => (
            <motion.div
              key={i}
              className="relative overflow-hidden cursor-pointer"
              style={{ aspectRatio: `${item.width / item.height}` }}
              onClick={() => setSelectedIndex(i)}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, delay: i * 0.07, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Image
                src={item.src}
                alt={`Gallery item ${i + 1}`}
                fill
                className="object-cover"
                sizes="50vw"
              />
              {item.label && (
                <p className="absolute bottom-2 left-2 text-[10px] tracking-widest text-white drop-shadow-sm">
                  {item.label[0]}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Desktop: absolute editorial layout ───────────────────────────── */}
      <div className="hidden lg:block relative w-full h-full">
        {items.map((item, i) => {
          const delay = i * 0.12;

          const img = (
            <div
              style={{ width: item.width, height: item.height, overflow: "hidden", cursor: "pointer" }}
              onClick={() => setSelectedIndex(i)}
            >
              <motion.div
                style={{ width: "100%", height: "100%" }}
                initial={{ clipPath: "inset(100% 0 0 0)", scale: 1.08 }}
                animate={
                  isVisible
                    ? { clipPath: "inset(0% 0 0 0)", scale: 1 }
                    : { clipPath: "inset(0 0 100% 0)", scale: 1.05 }
                }
                transition={
                  isVisible
                    ? { duration: 1.1, delay, ease: [0.25, 0.1, 0.25, 1] }
                    : { duration: 0.55, delay: 0, ease: [0.25, 0.1, 0.25, 1] }
                }
              >
                <Image
                  src={item.src}
                  alt={`Gallery item ${i + 1}`}
                  width={item.width}
                  height={item.height}
                  className="object-cover w-full h-full"
                  sizes={`${item.width}px`}
                />
              </motion.div>
            </div>
          );

          return (
            <div key={i} className="absolute" style={{ left: item.left, top: item.top }}>
              {item.labelPosition === "above" && item.label && (
                <div className="mb-1.5">
                  <GalleryLabel lines={item.label} visible={isVisible} delay={delay + 0.2} />
                </div>
              )}

              <div className={item.labelPosition === "left" ? "flex items-start gap-3" : "flex flex-col"}>
                {item.labelPosition === "left" && item.label && (
                  <div className="text-right pt-0.5">
                    <GalleryLabel lines={item.label} visible={isVisible} delay={delay + 0.2} />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  {img}
                  {item.expandable && (
                    <motion.span
                      style={{ fontSize: 11 }}
                      className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                      initial={{ opacity: 0 }}
                      animate={isVisible ? { opacity: 0.6 } : {}}
                      transition={{ duration: 0.6, delay: delay + 0.4 }}
                      onClick={() => setSelectedIndex(i)}
                    >
                      (Expand)
                    </motion.span>
                  )}
                  {item.labelPosition === "below" && item.label && (
                    <div className="mt-1">
                      <GalleryLabel lines={item.label} visible={isVisible} delay={delay + 0.2} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <motion.p
          className="absolute bottom-7 right-14 text-xs tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.6, delay: isVisible ? 0.8 : 0 }}
        >
          {counter}
        </motion.p>
      </div>

      <AnimatePresence>
        {selectedIndex !== null && (
          <DetailView
            items={items}
            initialIndex={selectedIndex}
            onClose={() => setSelectedIndex(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── DATA ────────────────────────────────────────────────────────────────────

// Section 2 — images exclusives : img-1, img-5, img-10, img-hero-2, img-3, img-13, inspi-1
const section2Items: GalleryItem[] = [
  { src: "/images/img-1.jpg",      left:  60, top:  40, width: 140, height: 175, label: LABEL, labelPosition: "left",  description: DESCRIPTIONS.default },
  { src: "/images/img-5.jpg",      left: 460, top:  40, width: 265, height: 175, expandable: true,                     description: DESCRIPTIONS.second },
  { src: "/images/img-10.jpeg",    left: 1130, top:  40, width: 130, height: 205, label: LABEL, labelPosition: "left", description: DESCRIPTIONS.third },
  { src: "/images/img-hero-2.jpg", left:  60, top: 430, width: 305, height: 175, label: LABEL, labelPosition: "above", description: DESCRIPTIONS.fourth },
  { src: "/images/img-3.jpg",      left: 840, top: 415, width: 130, height: 155, expandable: true,                     description: DESCRIPTIONS.default },
  { src: "/images/img-13.jpeg",    left: 595, top: 665, width: 265, height: 240, label: LABEL, labelPosition: "left",  description: DESCRIPTIONS.second },
  { src: "/images/inspi-1.jpeg",   left: 1040, top: 670, width: 130, height: 100, label: LABEL, labelPosition: "left", description: DESCRIPTIONS.third },
];

// Section 4 (affiché en Section3, 02/03) — images exclusives : img-8, img-14, img-2, img-section-1, img-6, img-hero-1, video-2
const section4Items: GalleryItem[] = [
  { src: "/images/img-8.jpeg",        left:  60, top:  40, width: 140, height: 175, label: LABEL, labelPosition: "left",  description: DESCRIPTIONS.third },
  { src: "/images/img-14.jpeg",       left: 460, top:  40, width: 265, height: 175, expandable: true,                     description: DESCRIPTIONS.fourth },
  { src: "/images/img-2.jpg",         left: 1130, top:  40, width: 130, height: 205, label: LABEL, labelPosition: "left", description: DESCRIPTIONS.default },
  { src: "/images/img-section-1.jpg", left:  60, top: 430, width: 305, height: 175, label: LABEL, labelPosition: "above", description: DESCRIPTIONS.second },
  { src: "/images/img-6.png",         left: 840, top: 415, width: 130, height: 155, expandable: true,                     description: DESCRIPTIONS.third },
  { src: "/images/img-hero-1.jpg",    left: 595, top: 665, width: 265, height: 240, label: LABEL, labelPosition: "left",  description: DESCRIPTIONS.fourth },
  { src: "/images/video-2.gif",       left: 1040, top: 670, width: 130, height: 100, label: LABEL, labelPosition: "left", description: DESCRIPTIONS.default },
];

// Section 3 (affiché en Section4, 03/03) — images exclusives : img-12, img-9, img-4, img-11, img-hero-2, img-5, img-13
const section3Items: GalleryItem[] = [
  { src: "/images/img-9.jpeg",     left: 460, top:  30, width: 285, height: 175, expandable: true,                      description: DESCRIPTIONS.second },
  { src: "/images/img-12.jpeg",    left: 115, top: 240, width: 215, height: 165, label: LABEL, labelPosition: "below",  description: DESCRIPTIONS.fourth },
  { src: "/images/img-4.webp",     left: 800, top: 250, width: 200, height: 240, expandable: true,                      description: DESCRIPTIONS.third },
  { src: "/images/img-11.jpeg",    left: 1270, top: 295, width: 130, height: 165, label: LABEL, labelPosition: "above", description: DESCRIPTIONS.default },
  { src: "/images/img-hero-2.jpg", left: 1270, top: 475, width: 130, height: 105,                                        description: DESCRIPTIONS.second },
  { src: "/images/img-5.jpg",      left: 220, top: 655, width: 140, height: 175, label: LABEL, labelPosition: "left",   description: DESCRIPTIONS.third },
  { src: "/images/img-13.jpeg",    left: 900, top: 645, width: 260, height: 230, label: LABEL, labelPosition: "left",   description: DESCRIPTIONS.fourth },
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
