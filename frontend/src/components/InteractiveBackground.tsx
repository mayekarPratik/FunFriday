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

// Strict, detailed SVG Path2D outline for Howling Werewolf
const WOLF_PATH_SVG = new Path2D(
  // Majestic howling werewolf silhouette profile (snout, ears, nape fur, chest, haunches, tail, ground)
  'M 18.5 2.5 ' + // Snout tip pointing up-right
  'L 17.2 4.2 ' +
  'C 16.5 3.5 15.2 3 13.8 2.8 ' +
  'L 14.5 0.5 ' + // Front ear tip
  'L 12.2 2.6 ' +
  'L 10.8 1.2 ' + // Back ear tip
  'L 9.5 3.2 ' +
  'C 8.2 4.5 7.2 6.2 6.5 8 ' + // Nape
  'L 4.5 7.5 ' + // Mane tuft 1
  'L 5.8 10 ' +
  'L 3.5 10.5 ' + // Mane tuft 2
  'L 5.2 13 ' +
  'L 3 14 ' + // Mane tuft 3
  'L 5.5 16.5 ' +
  'C 4.8 19 4.5 21.5 5 24 ' + // Back curve to haunches
  'C 4 25.5 3 27 2 28.5 ' + // Tail
  'C 4 29 6.5 28.5 8.5 27.2 ' +
  'L 9.5 28.5 ' + // Back paw/base
  'L 13 28.5 ' +
  'L 12.5 25.5 ' +
  'C 13.8 25 15 24 16 22.8 ' +
  'L 18.5 28.5 ' + // Front paw
  'L 21.5 28.5 ' +
  'L 19.5 24 ' + // Foreleg
  'C 20.8 21.5 21.5 18.5 21.2 15.5 ' + // Muscular chest
  'C 20.8 13 19.8 10.8 18.2 9 ' + // Throat
  'L 20.5 7.2 ' + // Open lower jaw
  'L 17.5 7 ' + // Throat cleft
  'L 19.8 4.8 ' + // Upper jaw
  'Z ' +
  // Majestic Crescent Moon outline encircling the howl
  'M 16 -1 A 14 14 0 1 0 30 13 A 11 11 0 1 1 16 -1 Z'
);
const WOLF_BOUNDS = { minX: 2, minY: -1, maxX: 30, maxY: 29 };

// Strict, recognizable SVG Path2D outline for Mafia Fedora, Glasses & Suit
const MAFIA_PATH_SVG = new Path2D(
  // Fedora Crown with center crease
  'M 6 12 C 8 7 11.5 5.5 16 7 C 20.5 5.5 24 7 26 12 L 26.5 15 L 5.5 15 Z ' +
  // Ribbon band
  'M 5.2 15 L 26.8 15 L 27.2 16.8 L 4.8 16.8 Z ' +
  // Wide Fedora Brim
  'M 1.5 17.5 C 6 15.8 11 16.5 16 16.5 C 21 16.5 26 15.8 30.5 17.5 C 26 20.2 21 19.5 16 19.5 C 11 19.5 6 20.2 1.5 17.5 Z ' +
  // Aviator Sunglasses
  'M 7.5 21.5 C 7.5 20.5 8.5 19.8 9.5 19.8 L 13.5 19.8 C 14.5 19.8 15.5 20.5 15.5 21.5 L 14.8 24.2 C 14.5 25.2 13.8 25.8 12.8 25.8 L 10.2 25.8 C 9.2 25.8 8.5 25.2 8.2 24.2 Z ' +
  'M 16.5 21.5 C 16.5 20.5 17.5 19.8 18.5 19.8 L 22.5 19.8 C 23.5 19.8 24.5 20.5 24.5 21.5 L 23.8 24.2 C 23.5 25.2 22.8 25.8 21.8 25.8 L 19.2 25.8 C 18.2 25.8 17.5 25.2 17.2 24.2 Z ' +
  'M 15.5 21.5 L 16.5 21.5 ' +
  // Collar & Tie
  'M 14 27.2 L 18 27.2 L 18.8 30.5 L 16 32.5 L 13.2 30.5 Z ' +
  'M 9.5 27.2 L 14 27.2 L 11.8 31 Z ' +
  'M 22.5 27.2 L 18 27.2 L 20.2 31 Z'
);
const MAFIA_BOUNDS = { minX: 1.5, minY: 5.5, maxX: 30.5, maxY: 32.5 };

/**
 * Helper function to generate shape perimeter pixel coordinates on an offscreen canvas.
 * Offsets the drawing by its true bounding box center to ensure perfect vertical and horizontal centering.
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

  // 1. Left-Center Positioning: 28% of screen width, 50% of screen height (vertical center)
  const centerX = width < 1024 ? width * 0.5 : width * 0.28;
  const centerY = height * 0.5;

  const bounds = iconType === 'wolf' ? WOLF_BOUNDS : MAFIA_BOUNDS;
  const shapeWidth = bounds.maxX - bounds.minX;
  const shapeHeight = bounds.maxY - bounds.minY;
  const shapeCenterX = bounds.minX + shapeWidth / 2;
  const shapeCenterY = bounds.minY + shapeHeight / 2;

  // Scale shape up to massive game-art scale (occupying ~55% of screen height)
  const scale = Math.min((width * 0.42) / shapeWidth, (height * 0.58) / shapeHeight, 18);

  ctx.save();
  // Translate to target screen position
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  // Offset by half its width and height so it scales from its true center
  ctx.translate(-shapeCenterX, -shapeCenterY);

  // 3. Strict Outline Enforcement (Stroke-Only, NO ctx.fill())
  ctx.lineWidth = 1.6 / scale;
  ctx.strokeStyle = '#ffffff';

  if (iconType === 'wolf') {
    ctx.stroke(WOLF_PATH_SVG);
  } else if (iconType === 'mafia') {
    ctx.stroke(MAFIA_PATH_SVG);
  }

  ctx.restore();

  // Extract outline perimeter points
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

export interface InteractiveBackgroundProps {
  isLandingPage?: boolean;
}

export const InteractiveBackground: React.FC<InteractiveBackgroundProps> = ({ isLandingPage = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isLandingPageRef = useRef(isLandingPage);
  const triggerExitRef = useRef<(() => void) | null>(null);
  const triggerEnterRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const prev = isLandingPageRef.current;
    isLandingPageRef.current = isLandingPage;

    if (prev && !isLandingPage) {
      // Transitioning: Landing -> Game (scatter/exit)
      if (triggerExitRef.current) {
        triggerExitRef.current();
      }
    } else if (!prev && isLandingPage) {
      // Transitioning: Game -> Landing (spawn at edges & assemble)
      if (triggerEnterRef.current) {
        triggerEnterRef.current();
      }
    }
  }, [isLandingPage]);

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

    // Adaptive Particle Count: 40 on mobile, 240 on desktop
    const particleCount = isMobile ? 40 : 240;
    const particles: Particle[] = [];

    const maxLineDistance = 45;
    let shapeOpacity = 0;
    let isExiting = !isLandingPageRef.current;
    let isCompletelyOffscreen = !isLandingPageRef.current;

    // Helper: Pick a random point along the perimeter/outer edges of the viewport
    const getRandomEdgeCoordinate = () => {
      const edge = Math.floor(Math.random() * 4);
      let edgeX = 0;
      let edgeY = 0;
      const margin = 20;

      switch (edge) {
        case 0: // Top edge
          edgeX = Math.random() * width;
          edgeY = -margin;
          break;
        case 1: // Right edge
          edgeX = width + margin;
          edgeY = Math.random() * height;
          break;
        case 2: // Bottom edge
          edgeX = Math.random() * width;
          edgeY = height + margin;
          break;
        case 3: // Left edge
        default:
          edgeX = -margin;
          edgeY = Math.random() * height;
          break;
      }
      return { edgeX, edgeY };
    };

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const baseSpeed = 0.12 + Math.random() * 0.2;
      const angle = Math.random() * Math.PI * 2;
      const baseAlpha = 0.25 + Math.random() * 0.65;

      const initX = isLandingPageRef.current ? Math.random() * width : -999;
      const initY = isLandingPageRef.current ? Math.random() * height : -999;

      particles.push({
        x: initX,
        y: initY,
        targetX: initX,
        targetY: initY,
        baseX: initX,
        baseY: initY,
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
      if (!isLandingPageRef.current) return;
      const shapeCoords = getShapeCoordinates(iconType, width, height);
      if (shapeCoords.length === 0) return;

      const sortedTargets = [...shapeCoords].sort((a, b) => a.x + a.y - (b.x + b.y));
      const sortedParticles = [...particles].sort((a, b) => a.x + a.y - (b.x + b.y));

      sortedParticles.forEach((p, index) => {
        const targetIdx = Math.floor((index / sortedParticles.length) * sortedTargets.length);
        const target = sortedTargets[targetIdx % sortedTargets.length];
        p.targetX = target.x;
        p.targetY = target.y;
        p.state = 'forming';
        p.vx *= 0.5;
        p.vy *= 0.5;
      });
    };

    const releaseParticles = () => {
      shapeOpacity = 0;
      particles.forEach((p) => {
        p.state = 'drifting';
        const scatterAngle = Math.random() * Math.PI * 2;
        const scatterSpeed = 0.25 + Math.random() * 0.45;
        p.vx = Math.cos(scatterAngle) * scatterSpeed;
        p.vy = Math.sin(scatterAngle) * scatterSpeed;
      });
    };

    // 1. Trigger Exit: Strong radial blast outwards to push all particles off-screen
    // 1. Trigger Exit: Smooth, graceful outward drift to push all particles off-screen
    const triggerExit = () => {
      isExiting = true;
      isCompletelyOffscreen = false;
      shapeOpacity = 0;

      const centerX = width * 0.5;
      const centerY = height * 0.5;

      particles.forEach((p) => {
        p.state = 'drifting';
        // Calculate radial direction vector from screen center
        let dx = p.x - centerX;
        let dy = p.y - centerY;
        const dist = Math.hypot(dx, dy) || 1;
        dx /= dist;
        dy /= dist;

        // Apply a gentle, elegant exit velocity that builds up smoothly
        const speed = 1.8 + Math.random() * 2.4;
        p.vx = dx * speed;
        p.vy = dy * speed;
      });
    };

    // 2. Trigger Enter: Spawn along viewport edges and glide smoothly to shape / center
    const triggerEnter = () => {
      isExiting = false;
      isCompletelyOffscreen = false;

      // Spawn each particle randomly on outer edges
      particles.forEach((p) => {
        const { edgeX, edgeY } = getRandomEdgeCoordinate();
        p.x = edgeX;
        p.y = edgeY;
        p.state = 'drifting';

        // Target somewhere inside screen
        const targetInsideX = width * 0.15 + Math.random() * (width * 0.7);
        const targetInsideY = height * 0.15 + Math.random() * (height * 0.7);
        p.targetX = targetInsideX;
        p.targetY = targetInsideY;

        // Gentle inward initial velocity
        const angle = Math.atan2(targetInsideY - edgeY, targetInsideX - edgeX);
        const inwardSpeed = 4 + Math.random() * 6;
        p.vx = Math.cos(angle) * inwardSpeed;
        p.vy = Math.sin(angle) * inwardSpeed;
      });

      // Default start forming wolf constellation on entry
      if (!isMobile) {
        applyShapeTargets('wolf');
      }
    };

    triggerExitRef.current = triggerExit;
    triggerEnterRef.current = triggerEnter;

    // State Machine Cycle (38 seconds total loop)
    let lastPhase = -1;
    const cycleDuration = 38000;
    const startTime = performance.now();

    let time = 0;

    const render = () => {
      time += 0.02;
      const activeLanding = isLandingPageRef.current;

      // Performance optimization: When in gameplay and all particles are offscreen, skip rendering
      if (!activeLanding && isCompletelyOffscreen) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const elapsed = (performance.now() - startTime) % cycleDuration;

      // State machine cycle runs only on desktop and only on the Landing Page
      if (!isMobile && activeLanding && !isExiting) {
        let currentPhase = 0;
        if (elapsed >= 0 && elapsed < 10000) {
          currentPhase = 1; // Drifting
        } else if (elapsed >= 10000 && elapsed < 19000) {
          currentPhase = 2; // Wolf shape
        } else if (elapsed >= 19000 && elapsed < 29000) {
          currentPhase = 3; // Drifting
        } else {
          currentPhase = 4; // Mafia shape
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

        // Smoothly fade constellation lines in during forming phases
        if (currentPhase === 2 || currentPhase === 4) {
          shapeOpacity = Math.min(1, shapeOpacity + 0.025);
        } else {
          shapeOpacity = Math.max(0, shapeOpacity - 0.02);
        }
      } else if (!activeLanding) {
        shapeOpacity = 0;
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      let visibleCount = 0;

      // Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Subtle twinkling
        p.alpha = p.baseAlpha + Math.sin(time * p.twinkleSpeed * 50 + i) * 0.15;
        p.alpha = Math.max(0.1, Math.min(1, p.alpha));

        if (!activeLanding || isExiting) {
          // Smooth outward acceleration towards outer bounds
          p.vx *= 1.018;
          p.vy *= 1.018;
          p.x += p.vx;
          p.y += p.vy;

          // Check if particle is still on screen (with 60px margin)
          if (p.x >= -60 && p.x <= width + 60 && p.y >= -60 && p.y <= height + 60) {
            visibleCount++;
          }
        } else if (p.state === 'drifting') {
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

          // Wrap around screen boundaries with margin on landing page
          if (p.x < -10) p.x = width + 10;
          else if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          else if (p.y > height + 10) p.y = -10;

          visibleCount++;
        } else {
          // Forming state: Smooth spring physics / lerp towards target
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;

          p.vx += dx * p.ease;
          p.vx *= p.friction;
          p.vy += dy * p.ease;
          p.vy *= p.friction;

          p.x += p.vx;
          p.y += p.vy;

          visibleCount++;
        }

        // Draw particle dot if within render bounds
        if (p.x >= -50 && p.x <= width + 50 && p.y >= -50 && p.y <= height + 50) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.fill();

          // Extra soft halo on forming particles & prominent stars
          const isForming = activeLanding && p.state === 'forming';
          if (p.size > 1.8 || isForming) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (isForming ? 1.6 : 2), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(186, 230, 253, ${p.alpha * 0.3})`;
            ctx.fill();
          }
        }
      }

      if (!activeLanding && visibleCount === 0) {
        isCompletelyOffscreen = true;
      }

      // Constellation Effect: Draw connecting lines only when forming shapes on landing page
      if (activeLanding && shapeOpacity > 0.001) {
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
      triggerExitRef.current = null;
      triggerEnterRef.current = null;
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

