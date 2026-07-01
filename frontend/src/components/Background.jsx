import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/* ============================================================
   ★ BIOLUMINESCENT NEURAL NETWORK BACKGROUND
   
   Layers:
   1. Deep tissue gradient (fluorescence microscopy aesthetic)
   2. Organic cell membrane blobs (animated, subtle)
   3. Neural connection paths (SVG, pulsing signals)
   4. Neural nodes (interactive, cursor-reactive)
   5. Floating organelle particles (bio-luminescent)
   6. Cursor spotlight (warm neural glow)
   7. DNA helix accent (corner decoration)
   ============================================================ */

const REPULSE_RADIUS = 150;
const REPULSE_FORCE = 80;

// ── Neural node positions (fixed layout for connection paths) ──
const NEURAL_NODES = [
  { id: 'n0', x: 8, y: 15, size: 5, color: '#00d4ff', pulseDelay: 0 },
  { id: 'n1', x: 22, y: 35, size: 6, color: '#0ef6cc', pulseDelay: 0.5 },
  { id: 'n2', x: 15, y: 65, size: 4, color: '#a78bfa', pulseDelay: 1.0 },
  { id: 'n3', x: 38, y: 12, size: 5, color: '#00d4ff', pulseDelay: 1.5 },
  { id: 'n4', x: 45, y: 50, size: 7, color: '#0ef6cc', pulseDelay: 0.3 },
  { id: 'n5', x: 55, y: 25, size: 4, color: '#38bdf8', pulseDelay: 0.8 },
  { id: 'n6', x: 68, y: 60, size: 6, color: '#a78bfa', pulseDelay: 1.2 },
  { id: 'n7', x: 75, y: 18, size: 5, color: '#00d4ff', pulseDelay: 0.6 },
  { id: 'n8', x: 82, y: 42, size: 4, color: '#0ef6cc', pulseDelay: 1.8 },
  { id: 'n9', x: 90, y: 72, size: 5, color: '#38bdf8', pulseDelay: 0.2 },
  { id: 'n10', x: 30, y: 78, size: 4, color: '#00d4ff', pulseDelay: 1.4 },
  { id: 'n11', x: 60, y: 82, size: 5, color: '#a78bfa', pulseDelay: 0.9 },
  { id: 'n12', x: 50, y: 8, size: 4, color: '#0ef6cc', pulseDelay: 2.0 },
  { id: 'n13', x: 92, y: 12, size: 3, color: '#38bdf8', pulseDelay: 1.1 },
  { id: 'n14', x: 5, y: 88, size: 4, color: '#0ef6cc', pulseDelay: 0.7 },
];

// ── Neural connections (from → to, defines signal paths) ──
const NEURAL_CONNECTIONS = [
  { from: 0, to: 1, speed: 3.5, color: '#00d4ff' },
  { from: 1, to: 4, speed: 4.0, color: '#0ef6cc' },
  { from: 1, to: 2, speed: 3.0, color: '#a78bfa' },
  { from: 3, to: 5, speed: 4.5, color: '#00d4ff' },
  { from: 5, to: 4, speed: 3.8, color: '#38bdf8' },
  { from: 5, to: 7, speed: 3.2, color: '#00d4ff' },
  { from: 4, to: 6, speed: 4.2, color: '#0ef6cc' },
  { from: 7, to: 8, speed: 3.6, color: '#38bdf8' },
  { from: 6, to: 9, speed: 4.0, color: '#a78bfa' },
  { from: 6, to: 11, speed: 3.4, color: '#0ef6cc' },
  { from: 2, to: 10, speed: 3.8, color: '#00d4ff' },
  { from: 10, to: 14, speed: 4.1, color: '#0ef6cc' },
  { from: 10, to: 11, speed: 3.5, color: '#a78bfa' },
  { from: 8, to: 9, speed: 3.0, color: '#00d4ff' },
  { from: 3, to: 12, speed: 4.3, color: '#38bdf8' },
  { from: 12, to: 5, speed: 3.7, color: '#0ef6cc' },
  { from: 7, to: 13, speed: 3.9, color: '#00d4ff' },
  { from: 8, to: 13, speed: 4.0, color: '#38bdf8' },
  { from: 4, to: 10, speed: 3.3, color: '#a78bfa' },
];

// ── Floating organelle particles ──
const ORGANELLE_COUNT = 50;
const organelleParticles = Array.from({ length: ORGANELLE_COUNT }, (_, i) => ({
  id: `org-${i}`,
  homeX: Math.random() * 100,
  homeY: Math.random() * 100,
  size: 2 + Math.random() * 4,
  opacity: 0.15 + Math.random() * 0.35,
  color: ['#00d4ff', '#0ef6cc', '#a78bfa', '#38bdf8', '#8b5cf6'][i % 5],
  floatDuration: 8 + Math.random() * 12,
  floatDelay: Math.random() * 8,
}));

const Background = () => {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animFrameRef = useRef(null);
  const timeRef = useRef(0);

  // Physics state for organelle particles
  const physicsState = useRef(
    organelleParticles.map(() => ({
      dx: 0, dy: 0,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      freqX: 0.003 + Math.random() * 0.008,
      freqY: 0.003 + Math.random() * 0.008,
      ampX: 20 + Math.random() * 50,
      ampY: 15 + Math.random() * 40,
    }))
  );

  const [offsets, setOffsets] = useState(
    () => organelleParticles.map(() => ({ dx: 0, dy: 0 }))
  );

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 25, damping: 35 });
  const springY = useSpring(mouseY, { stiffness: 25, damping: 35 });

  // ── Unified physics loop ──
  const tick = useCallback(() => {
    const el = containerRef.current;
    if (!el) { animFrameRef.current = requestAnimationFrame(tick); return; }

    const rect = el.getBoundingClientRect();
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    timeRef.current += 1;
    const t = timeRef.current;
    const states = physicsState.current;
    const next = [];

    for (let i = 0; i < organelleParticles.length; i++) {
      const s = states[i];
      const p = organelleParticles[i];

      const wanderX = Math.sin(t * s.freqX + s.phaseX) * s.ampX;
      const wanderY = Math.cos(t * s.freqY + s.phaseY) * s.ampY;

      const px = (p.homeX / 100) * rect.width + wanderX;
      const py = (p.homeY / 100) * rect.height + wanderY;

      const distX = px - mx;
      const distY = py - my;
      const dist = Math.sqrt(distX * distX + distY * distY);

      let rx = 0, ry = 0;
      if (dist < REPULSE_RADIUS && dist > 0) {
        const force = ((REPULSE_RADIUS - dist) / REPULSE_RADIUS) * REPULSE_FORCE;
        const angle = Math.atan2(distY, distX);
        rx = Math.cos(angle) * force;
        ry = Math.sin(angle) * force;
      }

      s.dx += (rx - s.dx) * 0.1;
      s.dy += (ry - s.dy) * 0.1;
      if (dist >= REPULSE_RADIUS) { s.dx *= 0.94; s.dy *= 0.94; }

      next.push({ dx: wanderX + s.dx, dy: wanderY + s.dy });
    }

    setOffsets(next);
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', onMove);
    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mouseX, mouseY, tick]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      {/* ── Layer 1: Deep tissue gradient ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse at 15% 20%, rgba(0, 30, 60, 0.6) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 75%, rgba(10, 5, 40, 0.5) 0%, transparent 45%),
          radial-gradient(ellipse at 50% 85%, rgba(0, 40, 50, 0.4) 0%, transparent 40%),
          radial-gradient(ellipse at 70% 15%, rgba(15, 5, 45, 0.3) 0%, transparent 35%),
          linear-gradient(180deg, #020a13 0%, #041020 30%, #06081a 60%, #020810 100%)
        `,
      }} />

      {/* ── Layer 2: Cell membrane organic blobs ── */}
      <motion.div
        style={{ position: 'absolute', top: '-8%', left: '5%', width: 550, height: 550, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.05) 0%, rgba(0, 100, 150, 0.02) 40%, transparent 70%)', filter: 'blur(80px)' }}
        animate={{ x: [0, 25, -10, 0], y: [0, -15, 20, 0], scale: [1, 1.06, 0.96, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{ position: 'absolute', top: '35%', right: '-5%', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.04) 0%, rgba(80, 40, 160, 0.02) 40%, transparent 70%)', filter: 'blur(90px)' }}
        animate={{ x: [0, -30, 20, 0], y: [0, 25, -20, 0], scale: [1, 0.95, 1.05, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{ position: 'absolute', bottom: '5%', left: '25%', width: 450, height: 450, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 246, 204, 0.04) 0%, rgba(0, 120, 100, 0.02) 40%, transparent 65%)', filter: 'blur(85px)' }}
        animate={{ x: [0, 35, -15, 0], y: [0, -25, 15, 0] }}
        transition={{ duration: 35, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{ position: 'absolute', top: '10%', left: '55%', width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.03) 0%, transparent 60%)', filter: 'blur(70px)' }}
        animate={{ x: [0, -20, 30, 0], y: [0, 20, -10, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Layer 3: Subtle grid (tissue matrix) ── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0, 212, 255, 0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 212, 255, 0.015) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
        maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
      }} />

      {/* ── Layer 4: Neural connection paths (SVG) ── */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {NEURAL_CONNECTIONS.map((conn, i) => (
            <linearGradient key={`grad-${i}`} id={`neural-grad-${i}`}>
              <stop offset="0%" stopColor={conn.color} stopOpacity="0" />
              <stop offset="50%" stopColor={conn.color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={conn.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Static path lines */}
        {NEURAL_CONNECTIONS.map((conn, i) => {
          const from = NEURAL_NODES[conn.from];
          const to = NEURAL_NODES[conn.to];
          const midX = (from.x + to.x) / 2 + (Math.sin(i * 1.5) * 6);
          const midY = (from.y + to.y) / 2 + (Math.cos(i * 1.2) * 5);
          return (
            <path
              key={`path-${i}`}
              d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
              fill="none"
              stroke={conn.color}
              strokeWidth="0.08"
              strokeOpacity="0.15"
            />
          );
        })}

        {/* Animated signal pulses along paths */}
        {NEURAL_CONNECTIONS.map((conn, i) => {
          const from = NEURAL_NODES[conn.from];
          const to = NEURAL_NODES[conn.to];
          const midX = (from.x + to.x) / 2 + (Math.sin(i * 1.5) * 6);
          const midY = (from.y + to.y) / 2 + (Math.cos(i * 1.2) * 5);
          const pathId = `signal-path-${i}`;
          return (
            <g key={`signal-${i}`}>
              <path
                id={pathId}
                d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                fill="none"
                stroke="none"
              />
              <circle r="0.4" fill={conn.color} opacity="0">
                <animateMotion
                  dur={`${conn.speed}s`}
                  repeatCount="indefinite"
                  begin={`${i * 0.4}s`}
                >
                  <mpath href={`#${pathId}`} />
                </animateMotion>
                <animate
                  attributeName="opacity"
                  values="0;0.9;0.9;0"
                  dur={`${conn.speed}s`}
                  repeatCount="indefinite"
                  begin={`${i * 0.4}s`}
                />
                <animate
                  attributeName="r"
                  values="0.2;0.5;0.3;0.2"
                  dur={`${conn.speed}s`}
                  repeatCount="indefinite"
                  begin={`${i * 0.4}s`}
                />
              </circle>
              {/* Glow trail */}
              <circle r="1.2" fill={conn.color} opacity="0" filter="url(#glow)">
                <animateMotion
                  dur={`${conn.speed}s`}
                  repeatCount="indefinite"
                  begin={`${i * 0.4}s`}
                >
                  <mpath href={`#${pathId}`} />
                </animateMotion>
                <animate
                  attributeName="opacity"
                  values="0;0.15;0.15;0"
                  dur={`${conn.speed}s`}
                  repeatCount="indefinite"
                  begin={`${i * 0.4}s`}
                />
              </circle>
            </g>
          );
        })}

        {/* Glow filter */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* ── Layer 5: Neural nodes ── */}
      {NEURAL_NODES.map((node) => (
        <div
          key={node.id}
          style={{
            position: 'absolute',
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: node.size * 2,
            height: node.size * 2,
            borderRadius: '50%',
            backgroundColor: node.color,
            boxShadow: `0 0 ${node.size * 3}px ${node.color}60, 0 0 ${node.size * 6}px ${node.color}20`,
            animation: `node-pulse ${2 + node.pulseDelay}s ease-in-out ${node.pulseDelay}s infinite`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* ── Layer 6: Floating organelle particles (cursor-repulsive) ── */}
      {organelleParticles.map((p, i) => {
        const o = offsets[i] || { dx: 0, dy: 0 };
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.homeX}%`,
              top: `${p.homeY}%`,
              transform: `translate(${o.dx}px, ${o.dy}px)`,
              willChange: 'transform',
            }}
          >
            <div style={{
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: p.color,
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}40`,
              animation: `glow-pulse ${p.floatDuration * 0.4}s ease-in-out ${p.floatDelay}s infinite`,
            }} />
          </div>
        );
      })}

      {/* ── Layer 7: Cursor neural spotlight ── */}
      <motion.div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 212, 255, 0.06) 0%, rgba(14, 246, 204, 0.03) 35%, transparent 65%)',
        x: springX, y: springY, translateX: '-50%', translateY: '-50%', filter: 'blur(50px)',
      }} />

      {/* ── Layer 8: DNA Helix accent (top-right) ── */}
      <motion.div
        style={{
          position: 'absolute', top: 30, right: 60,
          width: 40, height: 300,
          zIndex: 1,
          opacity: 0.25,
        }}
        animate={{ y: [0, 8, -4, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="40" height="300" viewBox="0 0 40 300" fill="none">
          {/* DNA strand 1 */}
          <path
            d="M 20 0 Q 40 25 20 50 Q 0 75 20 100 Q 40 125 20 150 Q 0 175 20 200 Q 40 225 20 250 Q 0 275 20 300"
            stroke="#00d4ff"
            strokeWidth="1"
            strokeOpacity="0.4"
            fill="none"
          />
          {/* DNA strand 2 */}
          <path
            d="M 20 0 Q 0 25 20 50 Q 40 75 20 100 Q 0 125 20 150 Q 40 175 20 200 Q 0 225 20 250 Q 40 275 20 300"
            stroke="#a78bfa"
            strokeWidth="1"
            strokeOpacity="0.3"
            fill="none"
          />
          {/* Cross bridges (base pairs) */}
          {[25, 75, 125, 175, 225, 275].map((y, i) => (
            <line
              key={i}
              x1={i % 2 === 0 ? 8 : 12}
              y1={y}
              x2={i % 2 === 0 ? 32 : 28}
              y2={y}
              stroke="#0ef6cc"
              strokeWidth="0.8"
              strokeOpacity="0.25"
            />
          ))}
          {/* Animated nucleotide dots */}
          {[25, 75, 125, 175, 225, 275].map((y, i) => (
            <circle
              key={`dot-${i}`}
              cx={i % 2 === 0 ? 20 : 20}
              cy={y}
              r="1.5"
              fill="#0ef6cc"
              opacity="0"
            >
              <animate
                attributeName="opacity"
                values="0;0.8;0"
                dur="3s"
                begin={`${i * 0.5}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </svg>
      </motion.div>

      {/* ── Layer 9: Heartbeat / EKG line (bottom) ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
        overflow: 'hidden', opacity: 0.12,
      }}>
        <svg width="100%" height="60" viewBox="0 0 1200 60" preserveAspectRatio="none">
          <path
            d="M 0 30 L 200 30 L 220 30 L 230 10 L 240 50 L 250 5 L 260 55 L 270 25 L 280 35 L 290 30 L 500 30 L 520 30 L 530 12 L 540 48 L 550 8 L 560 52 L 570 28 L 580 32 L 590 30 L 800 30 L 820 30 L 830 14 L 840 46 L 850 6 L 860 54 L 870 26 L 880 34 L 890 30 L 1200 30"
            fill="none"
            stroke="#00d4ff"
            strokeWidth="1.5"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="2400"
              to="0"
              dur="8s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M 0 30 L 200 30 L 220 30 L 230 10 L 240 50 L 250 5 L 260 55 L 270 25 L 280 35 L 290 30 L 500 30 L 520 30 L 530 12 L 540 48 L 550 8 L 560 52 L 570 28 L 580 32 L 590 30 L 800 30 L 820 30 L 830 14 L 840 46 L 850 6 L 860 54 L 870 26 L 880 34 L 890 30 L 1200 30"
            fill="none"
            stroke="#00d4ff"
            strokeWidth="1.5"
            strokeDasharray="2400"
            strokeDashoffset="2400"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="2400"
              to="0"
              dur="8s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>
    </div>
  );
};

export default Background;
