import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  baseVx: number;
  baseVy: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
}

export const InteractiveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Device detection: true only if width < 768px AND device supports touch events
    const isMobile = window.innerWidth < 768 && 'ontouchstart' in window;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates for desktop repulsion
    const mouse = {
      x: -9999,
      y: -9999,
      radius: 110,
      active: false
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
      mouse.active = false;
    };

    window.addEventListener('resize', handleResize);

    // Only register mouse movement events on non-mobile devices
    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseleave', handleMouseLeave);
    }

    // Adaptive Particle Count: 50 on mobile (~66% reduction), 150 on desktop
    const particleCount = isMobile ? 50 : 150;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const baseSpeed = 0.15 + Math.random() * 0.25;
      const angle = Math.random() * Math.PI * 2;
      const baseAlpha = 0.25 + Math.random() * 0.65;

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseVx: Math.cos(angle) * baseSpeed,
        baseVy: Math.sin(angle) * baseSpeed,
        vx: Math.cos(angle) * baseSpeed,
        vy: Math.sin(angle) * baseSpeed,
        size: 0.8 + Math.random() * 1.7, // 0.8px to 2.5px
        baseAlpha,
        alpha: baseAlpha,
        twinkleSpeed: 0.005 + Math.random() * 0.015
      });
    }

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Subtle twinkling
        p.alpha = p.baseAlpha + Math.sin(time * p.twinkleSpeed * 50 + i) * 0.15;
        p.alpha = Math.max(0.1, Math.min(1, p.alpha));

        // Physics: Skip mouse calculations entirely on mobile
        if (!isMobile) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const distance = Math.hypot(dx, dy);

          if (distance < mouse.radius && distance > 0) {
            // Gentle repulsion force
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const maxDistance = mouse.radius;
            const force = (maxDistance - distance) / maxDistance;
            const repulsionStrength = 2.5;

            // Push particle away from cursor
            p.vx -= forceDirectionX * force * repulsionStrength * 0.4;
            p.vy -= forceDirectionY * force * repulsionStrength * 0.4;
          } else {
            // Smoothly relax back to natural drift speed
            p.vx += (p.baseVx - p.vx) * 0.03;
            p.vy += (p.baseVy - p.vy) * 0.03;
          }
        }

        // Apply velocity
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around screen boundaries with margin
        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        else if (p.y > height + 10) p.y = -10;

        // Draw particle dot with soft glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fill();

        // Extra soft halo on slightly larger stars
        if (p.size > 1.8) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59, 130, 246, ${p.alpha * 0.2})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[-1] pointer-events-auto bg-black"
    />
  );
};

export default InteractiveBackground;
