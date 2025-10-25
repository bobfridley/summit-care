/* eslint-env browser */
import { useEffect, useState } from 'react';

export default function useMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    const w = globalThis.window;
    return !!w && w.innerWidth < breakpoint;
  });

  useEffect(() => {
    const w = globalThis.window;
    if (!w) return; // SSR guard

    const onResize = () => setIsMobile(w.innerWidth < breakpoint);
    w.addEventListener('resize', onResize, { passive: true });
    return () => w.removeEventListener('resize', onResize);
  }, [breakpoint]);

  return isMobile;
}
