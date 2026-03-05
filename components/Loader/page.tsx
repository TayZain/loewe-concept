"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "motion/react";

export default function Loader() {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Animate from 0 to 100
    const controls = animate(count, 100, {
      duration: 1.5,
      ease: "linear",
      onComplete: () => {
        setTimeout(() => {
          setShow(false);
          // Dispatch custom event when loader is complete
          window.dispatchEvent(new Event('loaderComplete'));
        }, 100);
      },
    });

    return controls.stop;
  }, [count]);

  return (
    <AnimatePresence>
      {show && (
        <motion.section
          key="loader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            // Slide up visual effect
            y: -50,
            transition: { duration: 0.8, ease: "easeInOut" }
          }}
          // Ensure z-index is high enough to cover everything
          className="fixed inset-0 z-9999 flex h-screen w-full items-center justify-center bg-white text-black"
        >
          <motion.div className="flex items-center justify-center">
            <h1 className="text-lg tracking-tighter tabular-nums">
              (<motion.span>{rounded}</motion.span>%)
            </h1>
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
