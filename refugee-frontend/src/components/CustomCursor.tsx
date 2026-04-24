import { useEffect, useRef } from 'react';

const CustomCursor = () => {
    const dotRef = useRef<HTMLDivElement>(null);
    const outlineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let ox = 0, oy = 0; // outline current pos
        let mx = 0, my = 0; // mouse target pos
        let raf: number;

        const onMouseMove = (e: MouseEvent) => {
            mx = e.clientX;
            my = e.clientY;
            // Instant dot — no delay
            if (dotRef.current) {
                dotRef.current.style.transform = `translate3d(${mx - 4}px, ${my - 4}px, 0)`;
            }
        };

        // Smooth trailing outline via manual lerp in rAF — much snappier than Web Animations API
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        const tick = () => {
            ox = lerp(ox, mx - 16, 0.18); // 0.18 = snappy but smooth
            oy = lerp(oy, my - 16, 0.18);
            if (outlineRef.current) {
                outlineRef.current.style.transform = `translate3d(${ox}px, ${oy}px, 0)`;
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        window.addEventListener('mousemove', onMouseMove, { passive: true });
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <div className="pointer-events-none hidden md:block z-[9999] fixed inset-0 w-full h-full">
            <div 
                ref={dotRef}
                className="absolute top-0 left-0 w-2 h-2 rounded-full will-change-transform bg-[#0f172a] dark:bg-white shadow-[0_0_6px_rgba(0,0,0,0.3)] dark:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            ></div>
            <div 
                ref={outlineRef}
                className="absolute top-0 left-0 w-8 h-8 rounded-full will-change-transform border-[1.5px] border-[#0f172a]/40 dark:border-white/50"
            ></div>
        </div>
    );
};

export default CustomCursor;
