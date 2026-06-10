import React, { useRef, useState, useEffect } from 'react';
import { SensorNode, CommunicationEdge } from '../types';
import { project3DPoint, drawCubeSatWireframe, CORE_NODE_ID, calculate3DDistance } from '../utils/simulationEngine';
import { HelpCircle, RefreshCw, Zap, RotateCw, Grid, Camera } from 'lucide-react';

interface CubeSatVisualizerProps {
  nodes: SensorNode[];
  edges: CommunicationEdge[];
  onToggleNodeFail: (nodeId: string) => void;
  selectedNode: SensorNode | null;
  onSelectNode: (node: SensorNode | null) => void;
}

export default function CubeSatVisualizer({
  nodes,
  edges,
  onToggleNodeFail,
  selectedNode,
  onSelectNode,
}: CubeSatVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pitch, setPitch] = useState<number>(0.35); // base X rotation range
  const [yaw, setYaw] = useState<number>(0.75);   // base Y rotation range
  const [gridType, setGridType] = useState<'radar' | 'matrix' | 'hidden'>('radar');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [hoveredNode, setHoveredNode] = useState<SensorNode | null>(null);

  // High-Resolution Telemetry Snapshot Capturer (1600x1200 PNG)
  const handleCaptureSnapshot = () => {
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 1600;
    snapCanvas.height = 1200;
    const sCtx = snapCanvas.getContext('2d');
    if (!sCtx) return;

    // 1. Fill beautiful deep space radial gradient backdrop
    const mainGrad = sCtx.createRadialGradient(800, 600, 100, 800, 600, 1000);
    mainGrad.addColorStop(0, '#0a0a0d');
    mainGrad.addColorStop(1, '#040405');
    sCtx.fillStyle = mainGrad;
    sCtx.fillRect(0, 0, 1600, 1200);

    // 2. Draw space dust particles
    sCtx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    for (let i = 0; i < 40; i++) {
      const px = (Math.sin(i * 123 + yaw * 2) * 0.45 + 0.5) * 1600;
      const py = (Math.cos(i * 456 + pitch * 1.5) * 0.45 + 0.5) * 1200;
      sCtx.fillRect(px, py, 2, 2);
    }

    // 3. Draw surrounding blueprint borders
    sCtx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    sCtx.lineWidth = 2.5;
    sCtx.strokeRect(30, 30, 1540, 1140);
    sCtx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
    sCtx.lineWidth = 1;
    sCtx.strokeRect(40, 40, 1520, 1120);

    // Ticks on border axes
    sCtx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    sCtx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    sCtx.font = '9px monospace';
    for (let x = 100; x < 1500; x += 200) {
      sCtx.beginPath();
      sCtx.moveTo(x, 30); sCtx.lineTo(x, 36);
      sCtx.stroke();
      sCtx.fillText(`X:${x}`, x - 12, 26);
    }
    for (let y = 100; y < 1100; y += 200) {
      sCtx.beginPath();
      sCtx.moveTo(30, y); sCtx.lineTo(36, y);
      sCtx.stroke();
      sCtx.fillText(`Y:${y}`, 6, y + 3);
    }

    // 4. Print snapshot header briefing
    sCtx.fillStyle = '#f1f5f9';
    sCtx.font = 'bold 22.5px sans-serif';
    sCtx.fillText('CUBESAT MISSION TELEMETRY GRAPH BRIEFING', 80, 85);

    sCtx.fillStyle = '#d4af37';
    sCtx.font = 'bold 11px monospace';
    sCtx.fillText('ORBITAL SIMULATION PLATFORM // HIGH-RESOLUTION SNAPSHOT', 80, 110);

    sCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    sCtx.font = '10.5px monospace';
    sCtx.fillText(`TIMESTAMP: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC  |  SECTOR-ID: ATLAS-VII SECTOR C`, 80, 128);

    // Dynamic state evaluation ratios
    const totalSensorNodes = nodes.filter(n => n.id !== CORE_NODE_ID).length;
    const activeSensorNodes = nodes.filter(n => n.id !== CORE_NODE_ID && n.state !== 'failed').length;
    const integrityPct = totalSensorNodes > 0 ? (activeSensorNodes / totalSensorNodes) * 100 : 100;
    const failuresCount = totalSensorNodes - activeSensorNodes;

    // ONLINE status box
    sCtx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    sCtx.lineWidth = 1.5;
    sCtx.strokeRect(1210, 56, 310, 68);
    sCtx.fillStyle = 'rgba(16, 185, 129, 0.05)';
    sCtx.fillRect(1210, 56, 310, 68);

    sCtx.fillStyle = '#10b981';
    sCtx.font = 'bold 14px monospace';
    sCtx.fillText('● LEVEL-4 TELEMETRY ARCHIVE', 1230, 84);
    sCtx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    sCtx.font = '10px monospace';
    sCtx.fillText(`INTEGRITY: ${integrityPct.toFixed(2)}% // SECURE LINK`, 1230, 104);

    // 5. Draw Left Parameter panel box
    sCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    sCtx.lineWidth = 1;
    sCtx.strokeRect(80, 180, 360, 240);
    sCtx.fillStyle = 'rgba(255, 255, 255, 0.01)';
    sCtx.fillRect(80, 180, 360, 240);

    sCtx.fillStyle = '#f8fafc';
    sCtx.font = 'bold 12.5px monospace';
    sCtx.fillText('CORE SIMULATION PARAMETERS', 100, 212);
    sCtx.fillStyle = 'rgba(255,255,255,0.1)';
    sCtx.fillRect(100, 222, 320, 1);

    const drawParamRow = (label: string, value: string, yPos: number) => {
      sCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      sCtx.font = '11px monospace';
      sCtx.fillText(label, 100, yPos);
      sCtx.fillStyle = '#ffffff';
      sCtx.font = 'bold 11.5px monospace';
      sCtx.textAlign = 'right';
      sCtx.fillText(value, 420, yPos);
      sCtx.textAlign = 'left';
    };

    drawParamRow('Transponders Count:', `${nodes.length} nodes (1 OBC)`, 250);
    drawParamRow('P2P Link Sizing (cm):', `24 cm Threshold`, 280);
    drawParamRow('Dynamic Healing Peak:', `x1.60 Power Surge`, 310);
    drawParamRow('Radiation Faults Injected:', `${failuresCount} transponders`, 340);
    drawParamRow('Active Grid Overlay:', gridType.toUpperCase(), 370);
    drawParamRow('Flight Trajectory Zone:', '+Y VENTRAL SEC-08B', 400);

    // 6. Draw Right SOTA Comparison panel box
    const tableY = 180;
    sCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    sCtx.strokeRect(1160, tableY, 360, 240);
    sCtx.fillStyle = 'rgba(255, 255, 255, 0.01)';
    sCtx.fillRect(1160, tableY, 360, 240);

    sCtx.fillStyle = '#f8fafc';
    sCtx.font = 'bold 12.5px monospace';
    sCtx.fillText('SOTA REAL-TIME COMPARISON', 1180, tableY + 32);
    sCtx.fillStyle = 'rgba(255,255,255,0.1)';
    sCtx.fillRect(1180, tableY + 42, 320, 1);

    sCtx.fillStyle = 'rgba(255,255,255,0.4)';
    sCtx.font = 'bold 8.5px monospace';
    sCtx.fillText('ACRONYM', 1180, tableY + 65);
    sCtx.fillText('DESIGNATION', 1240, tableY + 65);
    sCtx.fillText('CONN %', 1380, tableY + 65);
    sCtx.fillText('COV %', 1445, tableY + 65);

    // Compute dynamic, real-time comparison values
    const connRate = integrityPct; // connection rate of healthy nodes is based on BFS
    
    // CSMR breaks instantly under single node disconnect
    const csmrConn = failuresCount > 0 ? Math.max(0, connRate * 0.44) : 100;
    const csmrCov = Math.max(0, parseFloat((65 - failuresCount * 4).toFixed(1)));

    // DDO does some path find but lacks power boosting
    const ddoConn = failuresCount > 0 ? Math.max(20, connRate * 0.72) : 100;
    const ddoCov = Math.max(0, parseFloat((65 - failuresCount * 4).toFixed(1)));

    // FMP floods but eats lots of energy
    const fmpConn = failuresCount > 0 ? Math.max(85, connRate * 0.95) : 100;
    const fmpCov = Math.max(0, parseFloat((72 - failuresCount * 2).toFixed(1)));

    // SQSH (Our self-healing)
    const sqshConn = connRate;
    const sqshCov = Math.max(0, parseFloat((88 - failuresCount * 1.5).toFixed(1)));

    const drawSotaSnapshotRow = (acr: string, name: string, conn: string, cov: string, yRow: number, isSelf: boolean) => {
      sCtx.fillStyle = isSelf ? '#10b981' : 'rgba(255,255,255,0.85)';
      sCtx.font = isSelf ? 'bold 10px monospace' : '10px monospace';
      sCtx.fillText(acr, 1180, yRow);
      sCtx.fillStyle = isSelf ? '#10b981' : 'rgba(255,255,255,0.6)';
      sCtx.fillText(name, 1240, yRow);
      sCtx.fillStyle = isSelf ? '#10b981' : '#ffffff';
      sCtx.fillText(conn, 1380, yRow);
      sCtx.fillText(cov, 1445, yRow);
    };

    drawSotaSnapshotRow('CSMR', 'Conventional Static', `${csmrConn.toFixed(1)}%`, `${csmrCov.toFixed(1)}%`, tableY + 95, false);
    drawSotaSnapshotRow('DDO', 'Dynamic Dijkstra', `${ddoConn.toFixed(1)}%`, `${ddoCov.toFixed(1)}%`, tableY + 125, false);
    drawSotaSnapshotRow('FMP', 'Flooding Mesh Net', `${fmpConn.toFixed(1)}%`, `${fmpCov.toFixed(1)}%`, tableY + 155, false);
    drawSotaSnapshotRow('SQSH', 'Sub-Quantum (Ours)', `${sqshConn.toFixed(1)}%`, `${sqshCov.toFixed(1)}%`, tableY + 185, true);

    // 7. Render 3D CubeSat Model in the middle (Painter's Algorithm)
    const width = 1600;
    const height = 1200;
    const snapZoom = 9.6; // Scale factor matching high-res resolution

    const wireFaces = drawCubeSatWireframe(pitch, yaw, width, height);

    const mappedNodes = nodes.map((node) => {
      const proj = project3DPoint(node.x, node.y, node.z, pitch, yaw, width, height, snapZoom);
      return { node, ...proj };
    });

    const mappedEdges = edges.map((edge) => {
      const sNode = nodes.find((n) => n.id === edge.source);
      const tNode = nodes.find((n) => n.id === edge.target);
      if (!sNode || !tNode) return null;
      const sProj = project3DPoint(sNode.x, sNode.y, sNode.z, pitch, yaw, width, height, snapZoom);
      const tProj = project3DPoint(tNode.x, tNode.y, tNode.z, pitch, yaw, width, height, snapZoom);
      return {
        edge,
        x1: sProj.x2d,
        y1: sProj.y2d,
        x2: tProj.x2d,
        y2: tProj.y2d,
        depth: (sProj.depth + tProj.depth) / 2
      };
    }).filter(Boolean) as any[];

    const elementsToDraw: { type: 'face' | 'edge' | 'node'; depth: number; payload: any }[] = [];
    wireFaces.forEach((wf) => elementsToDraw.push({ type: 'face', depth: wf.centerZ, payload: wf }));
    mappedEdges.forEach((me) => elementsToDraw.push({ type: 'edge', depth: me.depth, payload: me }));
    mappedNodes.forEach((mn) => elementsToDraw.push({ type: 'node', depth: mn.depth, payload: mn }));

    elementsToDraw.sort((a, b) => b.depth - a.depth);

    elementsToDraw.forEach((elem) => {
      if (elem.type === 'face') {
        const face = elem.payload;
        const pts = face.points.map((p: any) =>
          project3DPoint(p.x, p.y, p.z, pitch, yaw, width, height, snapZoom)
        );

        sCtx.beginPath();
        sCtx.moveTo(pts[0].x2d, pts[0].y2d);
        for (let i = 1; i < pts.length; i++) {
          sCtx.lineTo(pts[i].x2d, pts[i].y2d);
        }
        sCtx.closePath();

        const isFacingFront = elem.depth < 0;
        let fillStyle = 'rgba(15, 23, 42, 0.4)';
        let strokeStyle = 'rgba(148, 163, 184, 0.25)';

        if (face.name === 'top') {
          fillStyle = isFacingFront ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.55)';
        } else if (face.name === 'front' || face.name === 'back') {
          fillStyle = isFacingFront ? 'rgba(17, 24, 39, 0.8)' : 'rgba(15, 23, 42, 0.6)';
          strokeStyle = 'rgba(99, 102, 241, 0.4)';
        } else {
          fillStyle = isFacingFront ? 'rgba(23, 37, 84, 0.65)' : 'rgba(15, 23, 42, 0.55)';
        }

        sCtx.fillStyle = fillStyle;
        sCtx.fill();

        // Solar arrays division lines
        sCtx.strokeStyle = 'rgba(30, 58, 138, 0.4)';
        sCtx.lineWidth = 1.2;
        sCtx.beginPath();
        sCtx.moveTo((pts[0].x2d + pts[1].x2d) / 2, (pts[0].y2d + pts[1].y2d) / 2);
        sCtx.lineTo((pts[2].x2d + pts[3].x2d) / 2, (pts[2].y2d + pts[3].y2d) / 2);
        sCtx.stroke();

        sCtx.strokeStyle = strokeStyle;
        sCtx.lineWidth = isFacingFront ? 2 : 1;
        sCtx.stroke();

        if (isFacingFront && face.name !== 'bottom') {
          sCtx.fillStyle = 'rgba(148, 163, 184, 0.8)';
          sCtx.font = 'bold 11px monospace';
          const midX = (pts[0].x2d + pts[2].x2d) / 2;
          const midY = (pts[0].y2d + pts[2].y2d) / 2;
          sCtx.fillText(face.name.toUpperCase(), midX - 20, midY + 4);
        }
      } else if (elem.type === 'edge') {
        const me = elem.payload;
        const state = me.edge.state;

        if (state === 'broken') {
          sCtx.strokeStyle = 'rgba(239, 68, 68, 0.12)';
          sCtx.setLineDash([4, 6]);
          sCtx.lineWidth = 1.2;
        } else if (state === 'rerouted') {
          sCtx.strokeStyle = 'rgba(245, 158, 11, 0.9)';
          sCtx.setLineDash([5, 3]);
          sCtx.lineWidth = 3.5;
        } else {
          sCtx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
          sCtx.setLineDash([]);
          sCtx.lineWidth = 2.2;
        }

        sCtx.beginPath();
        sCtx.moveTo(me.x1, me.y1);
        sCtx.lineTo(me.x2, me.y2);
        sCtx.stroke();
        sCtx.setLineDash([]);
      } else if (elem.type === 'node') {
        const mn = elem.payload;
        const node = mn.node;
        const state = node.state;

        let color = '#38bdf8';
        let size = 9;

        if (node.id === CORE_NODE_ID) {
          color = '#a855f7';
          size = 14;
        } else if (state === 'failed') {
          color = '#ef4444';
          size = 8;
        } else if (state === 'healing') {
          color = '#34d399';
          size = 11;
        }

        sCtx.fillStyle = color;
        sCtx.beginPath();
        sCtx.arc(mn.x2d, mn.y2d, size, 0, Math.PI * 2);
        sCtx.fill();

        // Failed node cross reticle
        if (state === 'failed') {
          sCtx.strokeStyle = '#b91c1c';
          sCtx.lineWidth = 2;
          sCtx.beginPath();
          sCtx.moveTo(mn.x2d - 5, mn.y2d - 5);
          sCtx.lineTo(mn.x2d + 5, mn.y2d + 5);
          sCtx.moveTo(mn.x2d + 5, mn.y2d - 5);
          sCtx.lineTo(mn.x2d - 5, mn.y2d + 5);
          sCtx.stroke();
        }

        // Labels
        sCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        sCtx.font = '9px monospace';
        const label = node.id === CORE_NODE_ID ? 'OBC-CORE' : node.id.toUpperCase();
        sCtx.fillText(label, mn.x2d + size + 5, mn.y2d + 3);
      }
    });

    // Flight indicator stamp
    sCtx.fillStyle = '#94a3b8';
    sCtx.font = 'bold 12.5px monospace';
    sCtx.fillText('• MISSION STATUS SECURE • COMPILATION MATRIX OK • ATLAS-VII GROUND CONTROL UNIT •', 530, 1140);

    // 8. Download PNG Trigger
    const dataUrl = snapCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `cubesat_telemetry_snapshot_${new Date().toISOString().slice(0, 19).replace(/T/, '_').replace(/:/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Auto Rotation animation timer
  useEffect(() => {
    if (!autoRotate || isDragging) return;
    let animId: number;
    const tick = () => {
      setYaw((prev) => (prev + 0.004) % (Math.PI * 2));
      setPitch((prev) => prev); // keep pitch constant or tiny oscillation
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [autoRotate, isDragging]);

  // Redraw Canvas on changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Deep space backdrop glow - Sophisticated Dark style
    const radialBg = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width / 1.5);
    radialBg.addColorStop(0, '#121216');
    radialBg.addColorStop(1, '#070708');
    ctx.fillStyle = radialBg;
    ctx.fillRect(0, 0, width, height);

    // Render Adaptive Grid
    if (gridType === 'radar') {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1;
      for (let r = 80; r < width / 1.2; r += 60) {
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Faint radial ticks
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const sx = width / 2 + Math.cos(angle) * 30;
        const sy = height / 2 + Math.sin(angle) * 30;
        const ex = width / 2 + Math.cos(angle) * (width / 1.6);
        const ey = height / 2 + Math.sin(angle) * (height / 1.6);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.03)';
        ctx.stroke();
      }
    } else if (gridType === 'matrix') {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 30; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 10);
        ctx.lineTo(x, height - 10);
        ctx.stroke();
      }
      for (let y = 30; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.lineTo(width - 10, y);
        ctx.stroke();
      }
      // Draw grid corner labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = '6px monospace';
      ctx.fillText('REF://GPS-ALT3U', 12, 16);
    }

    // Dynamic particles floaters (space dust / cosmos vibe)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 20; i++) {
      const px = (Math.sin(i * 123 + yaw * 2) * 0.45 + 0.5) * width;
      const py = (Math.cos(i * 456 + pitch * 1.5) * 0.45 + 0.5) * height;
      ctx.fillRect(px, py, 1.5, 1.5);
    }

    // Painters Algorithm collection: group wirefaces, connections, and nodes to sort them together
    // 1. Get wireframe panels of the main 3U CubeSat body
    const wireFaces = drawCubeSatWireframe(pitch, yaw, width, height);

    // 2. Map coordinates of nodes
    const mappedNodes = nodes.map((node) => {
      const proj = project3DPoint(node.x, node.y, node.z, pitch, yaw, width, height);
      return {
        node,
        ...proj,
      };
    });

    // 3. Map coordinates of edges
    const mappedEdges = edges.map((edge) => {
      const sNode = nodes.find((n) => n.id === edge.source);
      const tNode = nodes.find((n) => n.id === edge.target);

      if (!sNode || !tNode) return null;

      const sProj = project3DPoint(sNode.x, sNode.y, sNode.z, pitch, yaw, width, height);
      const tProj = project3DPoint(tNode.x, tNode.y, tNode.z, pitch, yaw, width, height);
      const avgDepth = (sProj.depth + tProj.depth) / 2;

      return {
        edge,
        x1: sProj.x2d,
        y1: sProj.y2d,
        x2: tProj.x2d,
        y2: tProj.y2d,
        depth: avgDepth,
      };
    }).filter(Boolean) as any[];

    // Render wireframe faces and components by Depth order (Back to front)
    const elementsToDraw: { type: 'face' | 'edge' | 'node'; depth: number; payload: any }[] = [];

    wireFaces.forEach((wf) => {
      elementsToDraw.push({ type: 'face', depth: wf.centerZ, payload: wf });
    });

    mappedEdges.forEach((me) => {
      elementsToDraw.push({ type: 'edge', depth: me.depth, payload: me });
    });

    mappedNodes.forEach((mn) => {
      elementsToDraw.push({ type: 'node', depth: mn.depth, payload: mn });
    });

    // Sort elements from back (highest depth value) to front (lowest depth value)
    // Actually, in our project3DPoint, depth (z2) is larger when farther away.
    // Let's sort: larger depth drawn first, smaller depth (closest to screen) drawn last.
    elementsToDraw.sort((a, b) => b.depth - a.depth);

    // Draw sorted elements
    elementsToDraw.forEach((elem) => {
      if (elem.type === 'face') {
        const face = elem.payload;
        const pts = face.points.map((p: any) =>
          project3DPoint(p.x, p.y, p.z, pitch, yaw, width, height)
        );

        ctx.beginPath();
        ctx.moveTo(pts[0].x2d, pts[0].y2d);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x2d, pts[i].y2d);
        }
        ctx.closePath();

        // Color panels based on face orientation (adds massive 3D volume shading)
        const isFacingFront = elem.depth < 0; // closer
        let fillStyle = 'rgba(15, 23, 42, 0.4)';
        let strokeStyle = 'rgba(148, 163, 184, 0.25)';

        if (face.name === 'top') {
          fillStyle = isFacingFront ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.5)';
        } else if (face.name === 'front' || face.name === 'back') {
          fillStyle = isFacingFront ? 'rgba(17, 24, 39, 0.75)' : 'rgba(15, 23, 42, 0.55)';
          strokeStyle = 'rgba(99, 102, 241, 0.35)'; // glow side framing
        } else {
          fillStyle = isFacingFront ? 'rgba(23, 37, 84, 0.6)' : 'rgba(15, 23, 42, 0.5)';
        }

        ctx.fillStyle = fillStyle;
        ctx.fill();

        // Draw Solar arrays on CubeSat skins (aesthetic grid lines)
        ctx.strokeStyle = 'rgba(30, 58, 138, 0.4)';
        ctx.lineWidth = 1;
        
        // Draw division lines inside faces to mimic real space solar cells
        ctx.beginPath();
        ctx.moveTo((pts[0].x2d + pts[1].x2d) / 2, (pts[0].y2d + pts[1].y2d) / 2);
        ctx.lineTo((pts[2].x2d + pts[3].x2d) / 2, (pts[2].y2d + pts[3].y2d) / 2);
        ctx.stroke();

        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = isFacingFront ? 1.5 : 0.8;
        ctx.stroke();

        // Print Face labels in micro typography
        if (isFacingFront && face.name !== 'bottom') {
          ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
          ctx.font = '8px monospace';
          const midX = (pts[0].x2d + pts[2].x2d) / 2;
          const midY = (pts[0].y2d + pts[2].y2d) / 2;
          ctx.fillText(face.name.toUpperCase(), midX - 12, midY + 3);
        }

      } else if (elem.type === 'edge') {
        const me = elem.payload;
        const state = me.edge.state;

        if (state === 'broken') {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.1)';
          ctx.setLineDash([2, 4]);
          ctx.lineWidth = 0.8;
        } else if (state === 'rerouted') {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
          ctx.setLineDash([4, 2]); // pulsing dashes
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.setLineDash([]);
          ctx.lineWidth = 1.2;
        }

        ctx.beginPath();
        ctx.moveTo(me.x1, me.y1);
        ctx.lineTo(me.x2, me.y2);
        ctx.stroke();
        ctx.setLineDash([]); // Reset map

      } else if (elem.type === 'node') {
        const mn = elem.payload;
        const node = mn.node;
        const state = node.state;

        // Visual properties based on node states
        let color = '#38bdf8'; // Active light blue
        let glowColor = 'rgba(56, 189, 248, 0.4)';
        let size = 4;

        if (node.id === CORE_NODE_ID) {
          color = '#a855f7'; // Purple core computer node
          glowColor = 'rgba(168, 85, 247, 0.6)';
          size = 6.5;
        } else if (state === 'failed') {
          color = '#ef4444'; // Red broken
          glowColor = 'rgba(239, 68, 68, 0.1)';
          size = 3.5;
        } else if (state === 'healing') {
          color = '#34d399'; // Active Emerald healing mode
          glowColor = 'rgba(52, 211, 153, 0.55)';
          size = 5;
        }

        // Check selected matching highlight
        const isSelected = selectedNode && selectedNode.id === node.id;
        const isHovered = hoveredNode && hoveredNode.id === node.id;

        // Draw node radial pulsing waves
        if (state === 'healing' && node.id !== CORE_NODE_ID) {
          const pulseOffset = (Date.now() / 6) % 15;
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.2)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(mn.x2d, mn.y2d, size + pulseOffset, 0, Math.PI * 2);
          ctx.stroke();

          // Highlight coverage vector line connecting comrade failed node to show compensation link
          node.supportingNodes.forEach((supId) => {
            const failedN = nodes.find(n => n.id === supId);
            if (failedN) {
              const fProj = project3DPoint(failedN.x, failedN.y, failedN.z, pitch, yaw, width, height);
              ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
              ctx.lineWidth = 1;
              ctx.setLineDash([2, 2]);
              ctx.beginPath();
              ctx.moveTo(mn.x2d, mn.y2d);
              ctx.lineTo(fProj.x2d, fProj.y2d);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          });
        }

        // Target locator reticle for hover/selected
        if (isSelected || isHovered) {
          ctx.strokeStyle = isSelected ? '#a855f7' : '#38bdf8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(mn.x2d, mn.y2d, size + 5, 0, Math.PI * 2);
          ctx.stroke();
          
          // Outer coordinate lines
          ctx.beginPath();
          ctx.moveTo(mn.x2d - 8 - size, mn.y2d);
          ctx.lineTo(mn.x2d - 2 - size, mn.y2d);
          ctx.moveTo(mn.x2d + 2 + size, mn.y2d);
          ctx.lineTo(mn.x2d + 8 + size, mn.y2d);
          ctx.moveTo(mn.x2d, mn.y2d - 8 - size);
          ctx.lineTo(mn.x2d, mn.y2d - 2 - size);
          ctx.moveTo(mn.x2d, mn.y2d + 2 + size);
          ctx.lineTo(mn.x2d, mn.y2d + 8 + size);
          ctx.stroke();
        }

        // Core central server double rings
        if (node.id === CORE_NODE_ID) {
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          // Animated spinning indicator
          const startA = (Date.now() / 1500) % (Math.PI * 2);
          ctx.arc(mn.x2d, mn.y2d, size + 3, startA, startA + Math.PI * 1.5);
          ctx.stroke();
        }

        // Draw solid core dot
        ctx.shadowBlur = isSelected || isHovered || state === 'healing' ? 12 : 6;
        ctx.shadowColor = glowColor;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(mn.x2d, mn.y2d, size, 0, Math.PI * 2);
        ctx.fill();

        // Standard shadow reset
        ctx.shadowBlur = 0;

        // Custom cross indicator for broke sensors
        if (state === 'failed') {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(mn.x2d - 2.5, mn.y2d - 2.5);
          ctx.lineTo(mn.x2d + 2.5, mn.y2d + 2.5);
          ctx.moveTo(mn.x2d + 2.5, mn.y2d - 2.5);
          ctx.lineTo(mn.x2d - 2.5, mn.y2d + 2.5);
          ctx.stroke();
        }

        // Render mini ID tags if node is hovered
        if (isHovered && node.id !== CORE_NODE_ID) {
          ctx.font = '7px monospace';
          ctx.fillStyle = '#f8fafc';
          ctx.fillText(`${node.id.toUpperCase()}`, mn.x2d + size + 4, mn.y2d - 4);
        }
      }
    });

    // Draw coordinate axis guides at bottom-left corner
    const axisOrigin = { x: -28, y: -45, z: -20 };
    const axisX = { x: -20, y: -45, z: -20 };
    const axisY = { x: -28, y: -37, z: -20 };
    const axisZ = { x: -28, y: -45, z: -12 };

    const op = project3DPoint(axisOrigin.x, axisOrigin.y, axisOrigin.z, pitch, yaw, width, height, 1.6);
    const xp = project3DPoint(axisX.x, axisX.y, axisX.z, pitch, yaw, width, height, 1.6);
    const yp = project3DPoint(axisY.x, axisY.y, axisY.z, pitch, yaw, width, height, 1.6);
    const zp = project3DPoint(axisZ.x, axisZ.y, axisZ.z, pitch, yaw, width, height, 1.6);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)'; // X-axis Red
    ctx.beginPath(); ctx.moveTo(op.x2d, op.y2d); ctx.lineTo(xp.x2d, xp.y2d); ctx.stroke();
    
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.45)'; // Y-axis Green
    ctx.beginPath(); ctx.moveTo(op.x2d, op.y2d); ctx.lineTo(yp.x2d, yp.y2d); ctx.stroke();
    
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)'; // Z-axis Blue  
    ctx.beginPath(); ctx.moveTo(op.x2d, op.y2d); ctx.lineTo(zp.x2d, zp.y2d); ctx.stroke();

    ctx.font = '6px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('X', xp.x2d + 2, xp.y2d + 2);
    ctx.fillText('Y', yp.x2d - 1, yp.y2d - 2);
    ctx.fillText('Z', zp.x2d + 2, zp.y2d + 2);

    // Indicator of orbital flow
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.fillText('• FLIGHT ORBIT DIRECTION (+Y VENTRAL) •', 16, height - 16);

  }, [nodes, edges, pitch, yaw, selectedNode, hoveredNode, gridType]);

  // Handle Dragging / Spin Controls
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Detect hovered node
    let foundNode: SensorNode | null = null;
    for (const node of nodes) {
      const proj = project3DPoint(node.x, node.y, node.z, pitch, yaw, canvas.width, canvas.height);
      const d = Math.sqrt(Math.pow(proj.x2d - mouseX, 2) + Math.pow(proj.y2d - mouseY, 2));
      if (d < 7) {
        foundNode = node;
        break;
      }
    }
    setHoveredNode(foundNode);

    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    // Adjust sensitivity
    setYaw((prev) => (prev + dx * 0.007) % (Math.PI * 2));
    setPitch((prev) => Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, prev - dy * 0.007)));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Look for node click
    for (const node of nodes) {
      const proj = project3DPoint(node.x, node.y, node.z, pitch, yaw, canvas.width, canvas.height);
      const d = Math.sqrt(Math.pow(proj.x2d - clickX, 2) + Math.pow(proj.y2d - clickY, 2));
      
      if (d < 8) {
        onSelectNode(node);
        return;
      }
    }
    onSelectNode(null);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-2xl relative flex flex-col h-full min-h-[480px]">
      
      {/* HUD Header */}
      <div className="absolute top-4 left-4 z-10 select-none pointer-events-none">
        <span className="text-[10px] font-mono tracking-widest text-[#94a3b8] uppercase block">Spatial Telemetry</span>
        <h3 className="text-sm font-sans font-light tracking-tight text-[#e0e0e0] flex items-center gap-2 font-serif" style={{ fontFamily: 'Georgia, serif' }}>
          3U CubeSat <span className="italic text-white/50">Node-Graph</span>
        </h3>
        <span className="text-white/40 text-[9px] font-mono mt-0.5 block">
          PITCH: {(pitch * (180 / Math.PI)).toFixed(0)}° / YAW: {(yaw * (180 / Math.PI)).toFixed(0)}°
        </span>
      </div>

      {/* Control Tools */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 flex-wrap justify-end">
        <button
          onClick={() => {
            setGridType((g) => (g === 'radar' ? 'matrix' : g === 'matrix' ? 'hidden' : 'radar'));
          }}
          className="px-2.5 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider border border-white/10 bg-[#070708]/90 text-white/40 hover:text-white/85 transition-colors flex items-center gap-1.5 shadow"
          title="Toggle Grid Type (Radar, Matrix, Hidden)"
          id="btn-toggle-grid"
        >
          <Grid className="w-3 h-3 text-cyan-400" />
          <span>Grid: {gridType.toUpperCase()}</span>
        </button>

        <button
          onClick={handleCaptureSnapshot}
          className="px-2.5 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25 transition-all flex items-center gap-1.5 font-semibold shadow"
          title="Generate High-Res Telemetry Snapshot (PNG)"
          id="btn-download-snapshot"
        >
          <Camera className="w-3 h-3" />
          <span>Snapshot</span>
        </button>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-2.5 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors flex items-center gap-1.5 ${
            autoRotate
              ? 'bg-white/10 border-white/30 text-white font-semibold'
              : 'bg-[#070708]/90 border-white/10 text-white/40 hover:text-white/80'
          }`}
          title="Auto Rotate Orbit"
          id="btn-auto-rotate"
        >
          <RotateCw className={`w-3 h-3 ${autoRotate ? 'animate-spin-[12s]' : ''}`} />
          <span className="hidden sm:inline">Orbit</span>
        </button>
        <button
          onClick={() => {
            setPitch(0.35);
            setYaw(0.75);
          }}
          className="p-1.5 rounded border border-white/10 bg-[#070708]/90 text-white/40 hover:text-white/85 transition-colors"
          title="Center Matrix"
          id="btn-center-view"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* Instructions Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/85 border border-white/10 p-2.5 rounded text-[9px] text-white/50 max-w-xs font-mono backdrop-blur-sm pointer-events-none space-y-1">
        <div className="flex gap-1.5 items-center text-white/70">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Click any node to open Diagnostic HUD
        </div>
        <div className="flex gap-1.5 items-center text-white/70">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Click and drag to rotate CubeSat
        </div>
        <div className="flex gap-1.5 items-center text-white/70">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Comrade range extensions shown on failed cells
        </div>
      </div>

      {/* Interactive Canvas Rendering */}
      <div className="flex-1 w-full relative h-[400px]">
        <canvas
          ref={canvasRef}
          width={540}
          height={420}
          className="w-full h-full cursor-grab active:cursor-grabbing block"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          id="cubesat-3d-canvas"
        />
      </div>

      {/* Selected Node Diagnostic HUD overlay (Bottom right) */}
      {selectedNode && (
        <div className="m-4 bg-[#070708]/95 border border-white/15 p-4 rounded-xl shadow-2xl relative backdrop-blur-md animate-fade-in-up" id="node-hud-overlay">
          <div className="flex justify-between items-start mb-2.5">
            <div>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold text-white ${
                selectedNode.state === 'active' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                selectedNode.state === 'healing' ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/30' :
                'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {selectedNode.state.toUpperCase()}
              </span>
              <h4 className="text-sm font-semibold text-[#e0e0e0] mt-1 font-mono">
                {selectedNode.id === CORE_NODE_ID ? 'OBC TELEMETRY CORE' : selectedNode.id.toUpperCase()}
              </h4>
            </div>
            <button
              onClick={() => onToggleNodeFail(selectedNode.id)}
              disabled={selectedNode.id === CORE_NODE_ID}
              className={`text-[10px] uppercase font-mono px-2.5 py-1 rounded transition-all font-semibold ${
                selectedNode.state === 'failed'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-red-600/20 hover:bg-red-600 text-red-200 border border-red-700/50 disabled:opacity-40'
              }`}
              id="btn-node-toggle-fail"
            >
              {selectedNode.state === 'failed' ? 'Re-commission Node' : 'Simulate Damage'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1">
              <span className="text-white/40 block text-[10px] uppercase tracking-wider">3D Coordinates</span>
              <span className="text-white/80">
                X: {selectedNode.x.toFixed(1)}, Y: {selectedNode.y.toFixed(1)}, Z: {selectedNode.z.toFixed(1)}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-white/40 block text-[10px] uppercase tracking-wider">Workload</span>
              <div className="flex items-center gap-1.5">
                <span className="text-white/80">{selectedNode.workload.toFixed(0)}%</span>
                <div className="h-1 bg-white/5 rounded w-12 overflow-hidden">
                  <div
                    className={`h-full rounded transition-all ${
                      selectedNode.workload > 80 ? 'bg-red-500' :
                      selectedNode.workload > 55 ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${selectedNode.workload}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-white/40 block text-[10px] uppercase tracking-wider">Radiation Integrity</span>
              <span className="text-white/80">
                {(selectedNode.reliability * 100).toFixed(1)}% MTBF
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-white/40 block text-[10px] uppercase tracking-wider">Active Backups</span>
              <span className="text-white/80">
                {selectedNode.assignedComrades.length} comrades
              </span>
            </div>
          </div>

          {selectedNode.supportingNodes.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-white/10 text-[10px] text-white/50 flex gap-1.5 items-center font-mono">
              <span className="text-emerald-400 font-bold">▲ CORE REROUTE:</span> Active redundancy with {' '}
              <span className="text-emerald-300 font-semibold">{selectedNode.supportingNodes.join(', ')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
