import React, { useEffect, useRef } from 'react';

export const AcousticStageCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const drawFrame = (timeMs: number) => {
      if (width <= 0 || height <= 0) return;
      ctx.clearRect(0, 0, width, height);

      const t = timeMs * 0.0007;

      // 1. Subtle dot-matrix grid
      const spacing = 30;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.075)';
      for (let gx = spacing * 0.5; gx < width; gx += spacing) {
        for (let gy = spacing * 0.5; gy < height; gy += spacing) {
          ctx.beginPath();
          ctx.arc(gx, gy, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Three clean, colorful live soundwave ribbons gliding smoothly across the backdrop
      const waves = [
        {
          yRatio: 0.46,
          amp: 26,
          freq: 0.0048,
          speed: 0.95,
          phase: 0.4,
          stops: ['rgba(46, 196, 182, 0)', 'rgba(46, 196, 182, 0.34)', 'rgba(78, 168, 222, 0.34)', 'rgba(78, 168, 222, 0)'],
          lineWidth: 1.6,
        },
        {
          yRatio: 0.52,
          amp: 32,
          freq: 0.0039,
          speed: -0.75,
          phase: 1.9,
          stops: ['rgba(168, 118, 255, 0)', 'rgba(168, 118, 255, 0.32)', 'rgba(255, 94, 126, 0.3)', 'rgba(255, 94, 126, 0)'],
          lineWidth: 1.5,
        },
        {
          yRatio: 0.58,
          amp: 20,
          freq: 0.0056,
          speed: 1.15,
          phase: 3.3,
          stops: ['rgba(255, 209, 102, 0)', 'rgba(255, 209, 102, 0.24)', 'rgba(46, 196, 182, 0.26)', 'rgba(46, 196, 182, 0)'],
          lineWidth: 1.25,
        },
      ];

      for (const wave of waves) {
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, wave.stops[0]);
        grad.addColorStop(0.28, wave.stops[1]);
        grad.addColorStop(0.72, wave.stops[2]);
        grad.addColorStop(1, wave.stops[3]);

        ctx.beginPath();
        const baseY = height * wave.yRatio;
        for (let x = 0; x <= width + 8; x += 8) {
          const u = x / Math.max(width, 1);
          const env = Math.sin(u * Math.PI);
          const y =
            baseY +
            (Math.sin(x * wave.freq + t * wave.speed + wave.phase) * wave.amp +
              Math.cos(x * wave.freq * 0.6 - t * wave.speed * 0.5) * (wave.amp * 0.35)) *
              env;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = grad;
        ctx.lineWidth = wave.lineWidth;
        ctx.stroke();
      }

      if (!prefersReduced) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    rafId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
