import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  baseX: number;
  baseY: number;
  baseVx: number;
  baseVy: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  state: 'drifting' | 'forming';
  friction: number;
  ease: number;
}

// Strict, recognizable SVG Path2D outline for Howling Werewolf
const WOLF_PATH_SVG = new Path2D(
  // Detailed howling wolf silhouette profile (ears, snout, teeth, neck, chest, haunches, tail)
  'M 4 28 ' +
  'L 6 22 ' +
  'C 5.2 19.5 4.8 17 5.2 14.5 ' +
  'C 5.8 12.2 7 10.2 8.5 8.5 ' +
  'C 7.8 7 7.2 5.5 7 4 ' +
  'L 5.5 1 ' +
  'L 10 3.5 ' +
  'C 11.2 2.5 12.8 1.8 14.5 1.2 ' +
  'L 14 -1.5 ' +
  'L 17.5 0.5 ' +
  'C 19.2 1 21 1.8 22.8 2.8 ' +
  'C 24.5 3.8 25.8 5.2 26.8 7 ' +
  'L 31 4.5 ' +
  'L 27.5 9.5 ' +
  'C 28.5 12 28.2 14.8 26.8 17.2 ' +
  'C 25 20.8 21.2 23.8 16.5 25 ' +
  'L 16.5 28 ' +
  'L 12 28 ' +
  'L 12.2 25.8 ' +
  'C 9.5 26 7 25.5 4 28 Z ' +
  // Moon ring framing the howl
  'M 18 -2 A 12 12 0 1 0 30 10 A 12 12 0 0 0 18 -2 Z'
);

// Strict, recognizable SVG Path2D outline for Mafia Fedora & Sunglasses
const MAFIA_PATH_SVG = new Path2D(
  // Fedora Crown with center crease
  'M 4.5 9.5 C 6 5.5 8.5 4.2 12 5.5 C 15.5 4.2 18 5.5 19.5 9.5 L 20 12 L 4 12 Z ' +
  // Hat Ribbon Band
  'M 3.8 12 L 20.2 12 L 20.6 13.5 L 3.4 13.5 Z ' +
  // Wide Curved Fedora Brim
  'M 1 14 C 4.5 12.5 8 13.2 12 13.2 C 16 13.2 19.5 12.5 23 14 C 19.5 16.2 15 15.6 12 15.6 C 9 15.6 4.5 16.2 1 14 Z ' +
  // Mafia Aviator Shades
  'M 5.5 17.5 C 5.5 16.8 6.2 16.2 7 16.2 L 10 16.2 C 10.8 16.2 11.5 16.8 11.5 17.5 L 11 19.8 C 10.8 20.5 10.2 21 9.5 21 L 7.5 21 C 6.8 21 6.2 20.5 6 19.8 Z ' +
  'M 12.5 17.5 C 12.5 16.8 13.2 16.2 14 16.2 L 17 16.2 C 17.8 16.2 18.5 16.8 18.5 17.5 L 18 19.8 C 17.8 20.5 17.2 21 16.5 21 L 14.5 21 C 13.8 21 13.2 20.5 13 19.8 Z ' +
  'M 11.5 17.5 L 12.5 17.5 ' +
  // Collar & Tie
  'M 10.5 22 L 13.5 22 L 14.2 24.8 L 12 26.5 L 9.8 24.8 Z ' +
  'M 7.2 22 L 10.5 22 L 8.8 25.2 Z ' +
  'M 16.8 22 L 13.5 22 L 15.2 25.2 Z'
);

/**
 * Helper function to generate shape perimeter pixel coordinates on an offscreen canvas.
 * Uses Stroke-Only rendering to ensure particles map strictly to the outer perimeter outlines.
 */
function getShapeCoordinates(
  iconType: 'wolf' | 'mafia',
  width: number,
  height: number
): { x: number; y: number }[] {
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  ctx.clearRect(0, 0, width, height);

  // Position on the left side with massive scaling
  const cx = width < 1024 ? width * 0.45 : width * 0.22;
  const cy = height * 0.34;
  const scale = Math.min(width * 0.019, height * 0.026, 19);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Stroke-Only rendering (thick perimeter line without filling)
  ctx.lineWidth = 1.8 / scale;
  ctx.strokeStyle = '#ffffff';

  if (iconType === 'wolf') {
    ctx.stroke(WOLF_PATH_SVG);
  } else if (iconType === 'mafia') {
    ctx.stroke(MAFIA_PATH_SVG);
  }

  ctx.restore();

  // Extract pixel coordinates where alpha > 128 (perimeter outline only)
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const perimeterPoints: { x: number; y: number }[] = [];

  const step = 3;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] > 128) {
        perimeterPoints.push({ x, y });
      }
    }
  }

  return perimeterPoints;
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

    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseleave', handleMouseLeave);
    }

    // Adaptive Particle Count: 40 on mobile, 240 on desktop for rich, fast constellation performance
    const particleCount = isMobile ? 40 : 240;
    const particles: Particle[] = [];

    const maxLineDistance = 45;
    let shapeOpacity = 0;

    for (let i = 0; i < particleCount; i++) {
      const baseSpeed = 0.12 + Math.random() * 0.2;
      const angle = Math.random() * Math.PI * 2;
      const baseAlpha = 0.25 + Math.random() * 0.65;
      const randX = Math.random() * width;
      const randY = Math.random() * height;

      particles.push({
        x: randX,
        y: randY,
        targetX: randX,
        targetY: randY,
        baseX: randX,
        baseY: randY,
        baseVx: Math.cos(angle) * baseSpeed,
        baseVy: Math.sin(angle) * baseSpeed,
        vx: Math.cos(angle) * baseSpeed,
        vy: Math.sin(angle) * baseSpeed,
        size: 0.8 + Math.random() * 1.8,
        baseAlpha,
        alpha: baseAlpha,
        twinkleSpeed: 0.005 + Math.random() * 0.015,
        state: 'drifting',
        friction: 0.92,
        ease: 0.024
      });
    }

    const applyShapeTargets = (iconType: 'wolf' | 'mafia') => {
      const shapeCoords = getShapeCoordinates(iconType, width, height);
      if (shapeCoords.length === 0) return;

      // Sort targets spatially (by x + y) to match nearby particles smoothly
      const sortedTargets = [...shapeCoords].sort((a, b) => a.x + a.y - (b.x + b.y));
      const sortedParticles = [...particles].sort((a, b) => a.x + a.y - (b.x + b.y));

      sortedParticles.forEach((p, index) => {
        const targetIdx = Math.floor((index / sortedParticles.length) * sortedTargets.length);
        const target = sortedTargets[targetIdx % sortedTargets.length];
        p.targetX = target.x + (Math.random() - 0.5) * 2;
        p.targetY = target.y + (Math.random() - 0.5) * 2;
        p.state = 'forming';
        // Gentle initial inertia damping for a fluid glide
        p.vx *= 0.5;
        p.vy *= 0.5;
      });
    };

    const releaseParticles = () => {
      particles.forEach((p) => {
        p.state = 'drifting';
        // Soft, organic scatter nudge so they slowly disengage and drift apart
        const scatterAngle = Math.random() * Math.PI * 2;
        const scatterSpeed = 0.25 + Math.random() * 0.45;
        p.vx = Math.cos(scatterAngle) * scatterSpeed;
        p.vy = Math.sin(scatterAngle) * scatterSpeed;
      });
    };

    // State Machine Cycle (28 seconds total loop - 10s gap, 2s shape hold)
    // Phase 1 (0-10s): Drifting (10s gap)
    // Phase 2 (10-14s): Wolf (forms & holds shape for 2s)
    // Phase 3 (14-24s): Drifting (10s gap)
    // Phase 4 (24-28s): Mafia (forms & holds shape for 2s)
    let lastPhase = -1;
    const cycleDuration = 28000;
    const startTime = performance.now();

    let time = 0;

    const render = () => {
      time += 0.02;
      const elapsed = (performance.now() - startTime) % cycleDuration;

      // On non-mobile devices, check and update current cycle phase
      if (!isMobile) {
        let currentPhase = 0;
        if (elapsed >= 0 && elapsed < 10000) {
          currentPhase = 1; // Phase 1: Drifting (10s gap)
        } else if (elapsed >= 10000 && elapsed < 14000) {
          currentPhase = 2; // Phase 2: Wolf (holds 2s)
        } else if (elapsed >= 14000 && elapsed < 24000) {
          currentPhase = 3; // Phase 3: Drifting (10s gap)
        } else {
          currentPhase = 4; // Phase 4: Mafia (holds 2s)
        }

        if (currentPhase !== lastPhase) {
          lastPhase = currentPhase;
          if (currentPhase === 1 || currentPhase === 3) {
            releaseParticles();
          } else if (currentPhase === 2) {
            applyShapeTargets('wolf');
          } else if (currentPhase === 4) {
            applyShapeTargets('mafia');
          }
        }

        // Smoothly fade constellation lines in during forming phases, out during drifting
        if (currentPhase === 2 || currentPhase === 4) {
          shapeOpacity = Math.min(1, shapeOpacity + 0.02);
        } else {
          shapeOpacity = Math.max(0, shapeOpacity - 0.015);
        }
      } else {
        shapeOpacity = 0;
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Subtle twinkling
        p.alpha = p.baseAlpha + Math.sin(time * p.twinkleSpeed * 50 + i) * 0.15;
        p.alpha = Math.max(0.1, Math.min(1, p.alpha));

        if (p.state === 'drifting') {
          // Physics: Mouse repulsion only on desktop while drifting
          if (!isMobile) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const distance = Math.hypot(dx, dy);

            if (distance < mouse.radius && distance > 0) {
              const forceDirectionX = dx / distance;
              const forceDirectionY = dy / distance;
              const maxDistance = mouse.radius;
              const force = (maxDistance - distance) / maxDistance;
              const repulsionStrength = 2.5;

              p.vx -= forceDirectionX * force * repulsionStrength * 0.4;
              p.vy -= forceDirectionY * force * repulsionStrength * 0.4;
            } else {
              // Smoothly relax back to natural drift speed
              p.vx += (p.baseVx - p.vx) * 0.015;
              p.vy += (p.baseVy - p.vy) * 0.015;
            }
          }

          p.x += p.vx;
          p.y += p.vy;

          // Wrap around screen boundaries with margin
          if (p.x < -10) p.x = width + 10;
          else if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          else if (p.y > height + 10) p.y = -10;
        } else {
          // Forming state: Smooth spring physics towards target
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;

          p.vx += dx * p.ease;
          p.vx *= p.friction;
          p.vy += dy * p.ease;
          p.vy *= p.friction;

          p.x += p.vx;
          p.y += p.vy;
        }

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fill();

        // Extra soft halo on forming particles & prominent stars
        if (p.size > 1.8 || p.state === 'forming') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (p.state === 'forming' ? 1.6 : 2), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(186, 230, 253, ${p.alpha * 0.3})`;
          ctx.fill();
        }
      }

      // Constellation Effect: Draw connecting lines when forming shapes
      if (shapeOpacity > 0.001) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < maxLineDistance) {
              const lineOpacity = (1 - distance / maxLineDistance) * shapeOpacity * 0.55;
              if (lineOpacity > 0.01) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(186, 230, 253, ${lineOpacity})`;
                ctx.lineWidth = 0.6;
                ctx.stroke();
              }
            }
          }
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

