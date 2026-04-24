import { useEffect, useRef } from 'react';

const ReactiveBackground = () => {
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    // Use rAF loop for GPU-smooth spotlight tracking instead of React state re-renders
    const tick = () => {
      const { x, y } = mouseRef.current;
      if (spotlightRef.current) {
        spotlightRef.current.style.maskImage = `radial-gradient(circle 300px at ${x}px ${y}px, black, transparent)`;
        (spotlightRef.current.style as any).webkitMaskImage = `radial-gradient(circle 300px at ${x}px ${y}px, black, transparent)`;
      }
      if (blobRef.current) {
        blobRef.current.style.transform = `translate3d(${x - 300}px, ${y - 300}px, 0)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] bg-white dark:bg-[#0a0f1a] overflow-hidden pointer-events-none transition-colors duration-300">
      {/* Base faint dot matrix — grey in light, dim white in dark */}
      <div 
        className="absolute inset-0 dot-matrix-base"
      ></div>

      {/* Reactive spotlight dot matrix overlay — brighter dots near cursor */}
      <div 
        ref={spotlightRef}
        className="absolute inset-0 dot-matrix-spotlight"
      ></div>

      {/* Soft glowing blob tracking the mouse */}
      <div 
        ref={blobRef}
        className="absolute rounded-full blur-[100px] opacity-30 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen pointer-events-none will-change-transform"
        style={{
           width: '600px',
           height: '600px',
           background: 'radial-gradient(circle, rgba(140, 190, 250, 0.8) 0%, transparent 70%)',
        }}
      ></div>
    </div>
  );
};

export default ReactiveBackground;
