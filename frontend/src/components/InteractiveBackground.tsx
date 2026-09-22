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

// Clean, geometric front-facing wolf silhouette matching the geometric head logo (Path2D SVG)
const WOLF_PATH_SVG = new Path2D(
  // Crown & Forehead
  'M 50 16 L 34 19 L 28 37 L 15 38 L 13 62 L 28 88 L 50 95 L 72 88 L 87 62 L 85 38 L 72 37 L 66 19 Z ' +

  // Left Ear
  'M 15 38 L 13 16 L 21 8 L 34 19 L 21 8 L 27 20 L 30 31 L 22 34 ' +

  // Right Ear
  'M 85 38 L 87 16 L 79 8 L 66 19 L 79 8 L 73 20 L 70 31 L 78 34 ' +

  // Brow & Forehead Creases
  'M 35 40 L 47 43 L 49 50 ' +
  'M 65 40 L 53 43 L 51 50 ' +

  // Eyes (Left & Right)
  'M 26 49 L 31 45 L 41 46 L 35 52 Z ' +
  'M 74 49 L 69 45 L 59 46 L 65 52 Z ' +

  // Cheeks & Whiskers
  'M 26 56 L 28 63 ' +
  'M 74 56 L 72 63 ' +
  'M 32 65 L 31 73 ' +
  'M 68 65 L 69 73 ' +

  // Snout & Bridge
  'M 49 50 L 45 53 L 44 74 L 45 76 ' +
  'M 51 50 L 55 53 L 56 74 L 55 76 ' +

  // Nose Hexagon
  'M 45 76 L 55 76 L 58 80 L 55 85 L 45 85 L 42 80 Z ' +

  // Muzzle & Mouth
  'M 34 79 L 41 89 L 50 90 L 59 89 L 66 79 ' +
  'M 45 85 L 41 89 ' +
  'M 55 85 L 59 89 ' +
  'M 50 90 L 50 95'
);
const WOLF_BOUNDS = { minX: 13, minY: 8, maxX: 87, maxY: 95 };

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

  // Left-Center Positioning: 28% of screen width on desktop, 50% on mobile
  const centerX = width < 1024 ? width * 0.5 : width * 0.28;
  const centerY = height * 0.5;

  const bounds = iconType === 'wolf' ? WOLF_BOUNDS : MAFIA_BOUNDS;
  const shapeWidth = bounds.maxX - bounds.minX;
  const shapeHeight = bounds.maxY - bounds.minY;
  const shapeCenterX = bounds.minX + shapeWidth / 2;
  const shapeCenterY = bounds.minY + shapeHeight / 2;

  // Scale shape up to occupy ~56% of screen height
  const scale = Math.min((width * 0.42) / shapeWidth, (height * 0.58) / shapeHeight, iconType === 'wolf' ? 7.5 : 18);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.translate(-shapeCenterX, -shapeCenterY);

  ctx.lineWidth = 1.6 / scale;
  ctx.strokeStyle = '#ffffff';

  if (iconType === 'wolf') {
    ctx.stroke(WOLF_PATH_SVG);
  } else if (iconType === 'mafia') {
    ctx.stroke(MAFIA_PATH_SVG);
  }

  ctx.restore();

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
      if (triggerExitRef.current) {
        triggerExitRef.current();
      }
    } else if (!prev && isLandingPage) {
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

    const isMobile = window.innerWidth < 768 && 'ontouchstart' in window;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

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

    // Increased particle count for crisp, well-defined silhouette lines
    const particleCount = isMobile ? 50 : 320;
    const particles: Particle[] = [];

    // Tighter constellation distance so lines trace the actual shape contour cleanly
    const maxLineDistance = isMobile ? 32 : 36;
    let shapeOpacity = 0;
    let currentShapeType: 'none' | 'wolf' | 'mafia' = 'none';
    let isExiting = !isLandingPageRef.current;
    let isCompletelyOffscreen = !isLandingPageRef.current;

    const getRandomEdgeCoordinate = () => {
      const edge = Math.floor(Math.random() * 4);
      let edgeX = 0;
      let edgeY = 0;
      const margin = 20;

      switch (edge) {
        case 0:
          edgeX = Math.random() * width;
          edgeY = -margin;
          break;
        case 1:
          edgeX = width + margin;
          edgeY = Math.random() * height;
          break;
        case 2:
          edgeX = Math.random() * width;
          edgeY = height + margin;
          break;
        case 3:
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
        ease: 0.026
      });
    }

    const applyShapeTargets = (iconType: 'wolf' | 'mafia') => {
      if (!isLandingPageRef.current) return;
      currentShapeType = iconType;
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
        p.vx *= 0.4;
        p.vy *= 0.4;
      });
    };

    const releaseParticles = () => {
      currentShapeType = 'none';
      shapeOpacity = 0;
      particles.forEach((p) => {
        p.state = 'drifting';
        const scatterAngle = Math.random() * Math.PI * 2;
        const scatterSpeed = 0.25 + Math.random() * 0.45;
        p.vx = Math.cos(scatterAngle) * scatterSpeed;
        p.vy = Math.sin(scatterAngle) * scatterSpeed;
      });
    };

    const triggerExit = () => {
      isExiting = true;
      isCompletelyOffscreen = false;
      shapeOpacity = 0;

      const centerX = width * 0.5;
      const centerY = height * 0.5;

      particles.forEach((p) => {
        p.state = 'drifting';
        let dx = p.x - centerX;
        let dy = p.y - centerY;
        const dist = Math.hypot(dx, dy) || 1;
        dx /= dist;
        dy /= dist;

        const speed = 1.8 + Math.random() * 2.4;
        p.vx = dx * speed;
        p.vy = dy * speed;
      });
    };

    const triggerEnter = () => {
      isExiting = false;
      isCompletelyOffscreen = false;

      particles.forEach((p) => {
        const { edgeX, edgeY } = getRandomEdgeCoordinate();
        p.x = edgeX;
        p.y = edgeY;
        p.state = 'drifting';

        const targetInsideX = width * 0.15 + Math.random() * (width * 0.7);
        const targetInsideY = height * 0.15 + Math.random() * (height * 0.7);
        p.targetX = targetInsideX;
        p.targetY = targetInsideY;

        const angle = Math.atan2(targetInsideY - edgeY, targetInsideX - edgeX);
        const inwardSpeed = 4 + Math.random() * 6;
        p.vx = Math.cos(angle) * inwardSpeed;
        p.vy = Math.sin(angle) * inwardSpeed;
      });

      if (!isMobile) {
        applyShapeTargets('wolf');
      }
    };

    triggerExitRef.current = triggerExit;
    triggerEnterRef.current = triggerEnter;

    let lastPhase = -1;
    const cycleDuration = 38000;
    const startTime = performance.now();
    let time = 0;

    const render = () => {
      time += 0.02;
      const activeLanding = isLandingPageRef.current;

      if (!activeLanding && isCompletelyOffscreen) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const elapsed = (performance.now() - startTime) % cycleDuration;

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

        p.alpha = p.baseAlpha + Math.sin(time * p.twinkleSpeed * 50 + i) * 0.15;
        p.alpha = Math.max(0.1, Math.min(1, p.alpha));

        if (!activeLanding || isExiting) {
          p.vx *= 1.018;
          p.vy *= 1.018;
          p.x += p.vx;
          p.y += p.vy;

          if (p.x >= -60 && p.x <= width + 60 && p.y >= -60 && p.y <= height + 60) {
            visibleCount++;
          }
        } else if (p.state === 'drifting') {
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
              p.vx += (p.baseVx - p.vx) * 0.015;
              p.vy += (p.baseVy - p.vy) * 0.015;
            }
          }

          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -10) p.x = width + 10;
          else if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          else if (p.y > height + 10) p.y = -10;

          visibleCount++;
        } else {
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

        // Draw particle dot with dynamic color when forming shapes & white when drifting
        if (p.x >= -50 && p.x <= width + 50 && p.y >= -50 && p.y <= height + 50) {
          const isForming = activeLanding && p.state === 'forming' && shapeOpacity > 0.05;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

          if (isForming && currentShapeType === 'wolf') {
            // Radiant Cyan-Blue / Violet highlight for Wolf
            ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
          } else if (isForming && currentShapeType === 'mafia') {
            // Warm Amber-Gold highlight for Mafia
            ctx.fillStyle = `rgba(251, 191, 36, ${p.alpha})`;
          } else {
            // Crisp White stars when drifting or scattered
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
          }
          ctx.fill();

          // Soft luminous aura around forming shape nodes
          if (p.size > 1.8 || isForming) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (isForming ? 2.0 : 1.8), 0, Math.PI * 2);
            if (isForming && currentShapeType === 'wolf') {
              ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha * 0.35 * shapeOpacity})`;
            } else if (isForming && currentShapeType === 'mafia') {
              ctx.fillStyle = `rgba(245, 158, 11, ${p.alpha * 0.35 * shapeOpacity})`;
            } else {
              ctx.fillStyle = `rgba(186, 230, 253, ${p.alpha * 0.25})`;
            }
            ctx.fill();
          }
        }
      }

      if (!activeLanding && visibleCount === 0) {
        isCompletelyOffscreen = true;
      }

      // Constellation Effect: Vibrant colored laser lines connecting shape nodes, crisp & clear
      if (activeLanding && shapeOpacity > 0.001) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < maxLineDistance) {
              const lineOpacity = (1 - distance / maxLineDistance) * shapeOpacity * 0.75;
              if (lineOpacity > 0.01) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);

                if (currentShapeType === 'wolf') {
                  // Vibrant Cyan / Sky-Blue constellation lines for clear wolf outline
                  ctx.strokeStyle = `rgba(56, 189, 248, ${lineOpacity})`;
                  ctx.lineWidth = 0.85;
                } else if (currentShapeType === 'mafia') {
                  // Rich Gold / Amber constellation lines for Mafia
                  ctx.strokeStyle = `rgba(251, 191, 36, ${lineOpacity})`;
                  ctx.lineWidth = 0.85;
                } else {
                  ctx.strokeStyle = `rgba(186, 230, 253, ${lineOpacity * 0.5})`;
                  ctx.lineWidth = 0.6;
                }
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

