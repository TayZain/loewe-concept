"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Section1, Section2, Section3, Section4 } from "../Section/page";

gsap.registerPlugin(ScrollTrigger);

export default function Intro() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.innerWidth < 1024) return; // mobile/tablet: vertical scroll, no GSAP

    const pin = gsap.fromTo(
      sectionRef.current,
      { translateX: 0 },
      {
        translateX: "-300vw",
        ease: "none",
        duration: 1,
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top",
          end: "3000 top",
          scrub: 1.8,
          pin: true,
        },
      }
    );

    return () => {
      pin.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <>
      {/* ── Desktop: GSAP horizontal scroll ─────────────────────────────── */}
      <div ref={triggerRef} className="hidden lg:block overflow-hidden">
        <div ref={sectionRef} className="flex h-screen w-[400vw]" style={{ willChange: "transform" }}>
          <Section1 />
          <Section2 />
          <Section3 />
          <Section4 />
        </div>
      </div>

      {/* ── Mobile / Tablet: vertical scroll ─────────────────────────────── */}
      <div className="lg:hidden flex flex-col">
        <Section1 />
        <Section2 />
        <Section3 />
        <Section4 />
      </div>
    </>
  );
}
