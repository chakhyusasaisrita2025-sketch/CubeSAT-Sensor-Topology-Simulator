import React, { useRef, useEffect } from 'react';
import { SensorNode } from '../types';
import { CORE_NODE_ID } from '../utils/simulationEngine';

interface CoverageHeatmapProps {
  nodes: SensorNode[];
  healingFactor: number;
}

export default function CoverageHeatmap({ nodes, healingFactor }: CoverageHeatmapProps) {
  const conventionalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const adaptiveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Unfolded skin projection offsets
  // We represent the 6 faces in an unfolded 2D box-layout:
  //         [TOP: 130, 20]
  // [LEFT: 10, 140] [FRONT: 130, 140] [RIGHT: 250, 140] [BACK: 370, 140]
  //         [BOTTOM: 130, 360]
  // Size parameters: Side views are and end caps are
  const W_FACE = 110;
  const H_FACE = 190;
  const END_W = 110;
  const END_H = 110;

  const getUnfoldedCoordinates = (node: SensorNode) => {
    // Determine face from node configurations
    // Check front face (z is positive & near CUBESAT_D / 2)
    // Here we can infer face based on node coordinates
    let fx = 130;
    let fy = 140;
    let faceName = 'front';

    const w = 24 / 2;
    const h = 64 / 2;
    const d = 24 / 2;

    if (Math.abs(node.z - d) < 0.2) {
      // Front face
      faceName = 'front';
      fx = 130 + (node.x / w) * (W_FACE / 2.5) + W_FACE / 2;
      fy = 140 + (-node.y / h) * (H_FACE / 2.5) + H_FACE / 2;
    } else if (Math.abs(node.z + d) < 0.2) {
      // Back face
      faceName = 'back';
      fx = 370 + (-node.x / w) * (W_FACE / 2.5) + W_FACE / 2;
      fy = 140 + (-node.y / h) * (H_FACE / 2.5) + H_FACE / 2;
    } else if (Math.abs(node.x - w) < 0.2) {
      // Right face
      faceName = 'right';
      fx = 250 + (-node.z / d) * (W_FACE / 2.5) + W_FACE / 2;
      fy = 140 + (-node.y / h) * (H_FACE / 2.5) + H_FACE / 2;
    } else if (Math.abs(node.x + w) < 0.2) {
      // Left face
      faceName = 'left';
      fx = 10 + (node.z / d) * (W_FACE / 2.5) + W_FACE / 2;
      fy = 140 + (-node.y / h) * (H_FACE / 2.5) + H_FACE / 2;
    } else if (Math.abs(node.y - h) < 0.2) {
      // Top face
      faceName = 'top';
      fx = 130 + (node.x / w) * (END_W / 2.5) + END_W / 2;
      fy = 20 + (-node.z / d) * (END_H / 2.5) + END_H / 2;
    } else if (Math.abs(node.y + h) < 0.2) {
      // Bottom face
      faceName = 'bottom';
      fx = 130 + (node.x / w) * (END_W / 2.5) + END_W / 2;
      fy = 340 + (node.z / d) * (END_H / 2.5) + END_H / 2;
    } else {
      // Internal core telemetry computer node
      faceName = 'core';
      fx = 130 + W_FACE / 2;
      fy = 140 + H_FACE / 2;
    }

    return { x: fx, y: fy, faceName };
  };

  const drawHeatmap = (canvas: HTMLCanvasElement, mode: 'conventional' | 'adaptive') => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Dark space telemetry theme - Sophisticated Dark style
    ctx.fillStyle = '#070708';
    ctx.fillRect(0, 0, width, height);

    // Draw Unfolded face layouts
    const faces = [
      { name: 'LEFT', x: 10, y: 140, w: W_FACE, h: H_FACE },
      { name: 'FRONT', x: 130, y: 140, w: W_FACE, h: H_FACE },
      { name: 'RIGHT', x: 250, y: 140, w: W_FACE, h: H_FACE },
      { name: 'BACK', x: 370, y: 140, w: W_FACE, h: H_FACE },
      { name: 'TOP', x: 130, y: 20, w: END_W, h: END_H },
      { name: 'BOTTOM', x: 130, y: 340, w: END_W, h: END_H },
    ];

    // Build thermal mesh arrays
    const gridSpacing = 4;
    const cellCountX = Math.ceil(width / gridSpacing);
    const cellCountY = Math.ceil(height / gridSpacing);

    for (let cy = 0; cy < cellCountY; cy++) {
      for (let cx = 0; cx < cellCountX; cx++) {
        const px = cx * gridSpacing + gridSpacing / 2;
        const py = cy * gridSpacing + gridSpacing / 2;

        // Check if points are inside any face boundaries
        let insideFace = false;
        for (const face of faces) {
          if (px >= face.x && px <= face.x + face.w && py >= face.y && py <= face.y + face.h) {
            insideFace = true;
            break;
          }
        }

        if (!insideFace) continue;

        // Calculate cumulative sensor field signal
        let signalIntensity = 0;

        nodes.forEach((node) => {
          if (node.id === CORE_NODE_ID) return;

          // Ignore failed nodes in both, but in conventional they don't boost neighbors
          const unfolded = getUnfoldedCoordinates(node);
          const dist = Math.sqrt(Math.pow(unfolded.x - px, 2) + Math.pow(unfolded.y - py, 2));

          if (node.state !== 'failed') {
            let radius = node.baseRadius * 3.5; // Scale range multiplier for 2D aesthetic overlay

            if (mode === 'adaptive' && node.supportingNodes.length > 0) {
              // Boost effective range due to comrade recovery support
              const currentRadius = Math.max(node.baseRadius, node.currentRadius);
              radius = currentRadius * 3.5;
            }

            if (dist < radius) {
              const weight = Math.exp(-Math.pow(dist / (radius * 0.7), 2));
              signalIntensity += weight;
            }
          }
        });

        // Determine spectrum heat pixels
        // Colors from cold Blue -> Teals -> Green -> Yellow -> Red
        let fillStyle = 'rgba(255, 255, 255, 0.03)'; // cold bare spot inside the carcass
        if (signalIntensity > 0.1 && signalIntensity <= 0.45) {
          // Weak sensing: soft teal
          fillStyle = `rgba(16, 185, 129, ${0.1 + signalIntensity * 0.18})`;
        } else if (signalIntensity > 0.45 && signalIntensity <= 0.9) {
          // Mid sensing: vivid emerald/green
          fillStyle = `rgba(52, 211, 153, ${0.25 + signalIntensity * 0.25})`;
        } else if (signalIntensity > 0.9 && signalIntensity <= 1.4) {
          // Perfect sensing overlap: amber gold
          fillStyle = `rgba(245, 158, 11, ${0.4 + (signalIntensity - 0.9) * 0.3})`;
        } else if (signalIntensity > 1.4) {
          // Super density overlap: high-energy red core
          fillStyle = `rgba(239, 68, 68, ${0.5 + Math.min(0.25, (signalIntensity - 1.4) * 0.15)})`;
        }

        ctx.fillStyle = fillStyle;
        ctx.fillRect(cx * gridSpacing, cy * gridSpacing, gridSpacing - 0.5, gridSpacing - 0.5);
      }
    }

    // Draw Face Border Frames and title banners
    ctx.lineWidth = 1;
    faces.forEach((face) => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.strokeRect(face.x, face.y, face.w, face.h);

      // Label face positions
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '6.5px monospace';
      ctx.fillText(face.name, face.x + 4, face.y + 11);
    });

    // Draw actual nodes on top of the heatmap
    nodes.forEach((node) => {
      if (node.id === CORE_NODE_ID) return;
      const unfolded = getUnfoldedCoordinates(node);

      ctx.beginPath();
      ctx.arc(unfolded.x, unfolded.y, node.state === 'failed' ? 1.8 : 2.5, 0, Math.PI * 2);

      let color = '#38bdf8'; // Active blue
      if (node.state === 'failed') {
        color = '#ef4444'; // Red failed
      } else if (mode === 'adaptive' && node.supportingNodes.length > 0) {
        color = '#10b981'; // Healing active
      }

      ctx.fillStyle = color;
      ctx.fill();

      if (node.state === 'failed') {
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    });

    // Heat overlay key legend at bottom
    const lx = 320;
    const ly = 430;
    const lWidth = 140;
    const lHeight = 6;
    
    // Draw horizontal gradient box
    const gradient = ctx.createLinearGradient(lx, ly, lx + lWidth, ly);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.8)');
    gradient.addColorStop(0.3, 'rgba(16, 185, 129, 0.5)');
    gradient.addColorStop(0.6, 'rgba(245, 158, 11, 0.7)');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.9)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(lx, ly, lWidth, lHeight);
    
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '7px monospace';
    ctx.fillText('0.0 (BLIND)', lx, ly - 3);
    ctx.fillText('1.5+ (MAX GAIN)', lx + lWidth - 60, ly - 3);

    // Dynamic scale info
    ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillText('SCALE: PROJECTED FLAT TELEMETRY SKIN', 10, height - 10);
  };

  useEffect(() => {
    const cCanvas = conventionalCanvasRef.current;
    const aCanvas = adaptiveCanvasRef.current;
    if (cCanvas && aCanvas) {
      drawHeatmap(cCanvas, 'conventional');
      drawHeatmap(aCanvas, 'adaptive');
    }
  }, [nodes, healingFactor]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-xl mb-8" id="coverage-heatmaps">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-4 mb-6">
        <div>
          <span className="text-white/40 text-[10px] font-mono uppercase tracking-[0.25em] font-semibold">Radiation Projection Analysis</span>
          <h2 className="text-xl font-light text-[#e0e0e0] tracking-tight mt-1 font-serif" style={{ fontFamily: 'Georgia, serif' }}>
            Spatial Coverage <span className="italic text-white/50">Persistence States</span>
          </h2>
          <p className="text-white/40 text-[11px] font-mono mt-1">
            Comparing blind zone profiles on the unfolded satellite outer skin.
          </p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-white/50 bg-black/40 px-3 py-1.5 rounded border border-white/10 mt-3 sm:mt-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-sky-500 rounded-full inline-block"></span>
            <span>Healthy Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
            <span>Damaged Node</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Conventional Canvas Card */}
        <div className="bg-[#070708] border border-white/10 rounded-xl overflow-hidden p-4 flex flex-col">
          <div className="mb-3">
            <span className="text-red-400 text-[10px] font-mono font-semibold block tracking-wider uppercase">Conventional Architecture</span>
            <span className="text-white/30 text-[10px] font-mono block mt-0.5">Fixed sensing grid. Node failures trigger direct localized silent zones.</span>
          </div>
          <div className="flex-1 flex justify-center items-center bg-[#070708] rounded overflow-auto">
            <canvas
              ref={conventionalCanvasRef}
              width={490}
              height={450}
              className="max-w-full h-auto aspect-[49/45]"
              id="conventional-coverage-canvas"
            />
          </div>
        </div>

        {/* Self-Healing Canvas Card */}
        <div className="bg-[#070708] border border-white/15 rounded-xl overflow-hidden p-4 flex flex-col">
          <div className="mb-3">
            <span className="text-emerald-400 text-[10px] font-mono font-semibold block tracking-wider uppercase">Self-Healing Architecture</span>
            <span className="text-white/30 text-[10px] font-mono block mt-0.5">Cognitive mesh recursion. Healthy comrades dynamically increase gain.</span>
          </div>
          <div className="flex-1 flex justify-center items-center bg-[#070708] rounded overflow-auto">
            <canvas
              ref={adaptiveCanvasRef}
              width={490}
              height={450}
              className="max-w-full h-auto aspect-[49/45]"
              id="adaptive-coverage-canvas"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
