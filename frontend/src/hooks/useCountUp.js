import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);
  const startValueRef = useRef(0);

  useEffect(() => {
    if (!Number.isFinite(target)) return undefined;
    if (prefersReducedMotion()) {
      setValue(target);
      startValueRef.current = target;
      return undefined;
    }

    const startValue = startValueRef.current;
    const startTime = performance.now();
    let frameId;

    const tick = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setValue(startValue + (target - startValue) * eased);
      if (progress < 1) frameId = requestAnimationFrame(tick);
      else startValueRef.current = target;
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      startValueRef.current = target;
    };
  }, [target, duration]);

  return value;
}
