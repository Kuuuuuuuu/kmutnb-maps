import { gsap } from "gsap";
import { useLayoutEffect, useRef } from "react";

type EntrancePreset =
  | "fadeDown"
  | "sheetUp"
  | "navTop"
  | "navBottom"
  | "modalBackdrop"
  | "modal"
  | "toast";

type Preset = {
  from: gsap.TweenVars;
  to: gsap.TweenVars;
};

const presets: Record<EntrancePreset, Preset> = {
  fadeDown: {
    from: { autoAlpha: 0, y: -8 },
    to: { autoAlpha: 1, y: 0, duration: 0.22, ease: "power3.out" },
  },
  sheetUp: {
    from: { autoAlpha: 0, y: 14, scale: 0.99 },
    to: { autoAlpha: 1, y: 0, scale: 1, duration: 0.22, ease: "power3.out" },
  },
  navTop: {
    from: { autoAlpha: 0, y: -10 },
    to: { autoAlpha: 1, y: 0, duration: 0.18, ease: "power3.out" },
  },
  navBottom: {
    from: { autoAlpha: 0, y: 10 },
    to: {
      autoAlpha: 1,
      y: 0,
      duration: 0.18,
      delay: 0.035,
      ease: "power3.out",
    },
  },
  modalBackdrop: {
    from: { autoAlpha: 0 },
    to: { autoAlpha: 1, duration: 0.14, ease: "power1.out" },
  },
  modal: {
    from: { autoAlpha: 0, y: 10, scale: 0.985 },
    to: { autoAlpha: 1, y: 0, scale: 1, duration: 0.18, ease: "power3.out" },
  },
  toast: {
    from: { autoAlpha: 0, y: 10 },
    to: { autoAlpha: 1, y: 0, duration: 0.18, ease: "power3.out" },
  },
};

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useGsapEntrance<T extends HTMLElement>(
  preset: EntrancePreset,
  dependency?: unknown,
) {
  const elementRef = useRef<T>(null);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const context = gsap.context(() => {
      if (prefersReducedMotion()) {
        gsap.set(element, { clearProps: "all" });
        return;
      }

      gsap.fromTo(element, presets[preset].from, presets[preset].to);
    }, element);

    return () => context.revert();
  }, [dependency, preset]);

  return elementRef;
}

export function useGsapSpin<T extends HTMLElement>(active: boolean) {
  const elementRef = useRef<T>(null);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element || !active || prefersReducedMotion()) {
      return;
    }

    const context = gsap.context(() => {
      gsap.to(element, {
        rotation: 360,
        duration: 0.8,
        ease: "none",
        repeat: -1,
      });
    }, element);

    return () => context.revert();
  }, [active]);

  return elementRef;
}
