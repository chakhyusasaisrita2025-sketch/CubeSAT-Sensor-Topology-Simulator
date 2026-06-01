import { SensorNode, CommunicationEdge, TopologyType } from '../types';

/**
 * 3D coordinate model of a 3U CubeSat (typically 10x10x30 cm, scaled here)
 * Width: 30, Height: 70, Depth: 30
 */
const CUBESAT_W = 24;
const CUBESAT_H = 64;
const CUBESAT_D = 24;

// Central telemetry bus core node (usually Node 0, placed inside or at the top)
export const CORE_NODE_ID = 'node-0';

/**
 * Generates an initially safe set of sensor nodes in 3D space based on topology type
 */
export function generateNodes(
  type: TopologyType,
  sensingRange: number
): SensorNode[] {
  const nodes: SensorNode[] = [];
  let idCounter = 0;

  // 1. Core Onboard Computer / Telemetry Hub (Inside near center)
  nodes.push({
    id: CORE_NODE_ID,
    x: 0,
    y: 0,
    z: 0,
    state: 'active',
    baseRadius: sensingRange * 1.5, // Stronger range for core receiver
    currentRadius: sensingRange * 1.5,
    workload: 30,
    reliability: 0.99,
    failureCount: 0,
    assignedComrades: [],
    supportingNodes: [],
  });
  idCounter++;

  // 2. Map sensor nodes onto the 6 faces of the 3U CubeSat structure
  // We'll distribute nodes as a grid or other topologies on faces
  const faces = [
    { name: 'front', dz: CUBESAT_D / 2, dx_range: [-CUBESAT_W / 2, CUBESAT_W / 2], dy_range: [-CUBESAT_H / 2, CUBESAT_H / 2] },
    { name: 'back', dz: -CUBESAT_D / 2, dx_range: [-CUBESAT_W / 2, CUBESAT_W / 2], dy_range: [-CUBESAT_H / 2, CUBESAT_H / 2] },
    { name: 'right', dx: CUBESAT_W / 2, dy_range: [-CUBESAT_H / 2, CUBESAT_H / 2], dz_range: [-CUBESAT_D / 2, CUBESAT_D / 2] },
    { name: 'left', dx: -CUBESAT_W / 2, dy_range: [-CUBESAT_H / 2, CUBESAT_H / 2], dz_range: [-CUBESAT_D / 2, CUBESAT_D / 2] },
    { name: 'top', dy: CUBESAT_H / 2, dx_range: [-CUBESAT_W / 2, CUBESAT_W / 2], dz_range: [-CUBESAT_D / 2, CUBESAT_D / 2] },
    { name: 'bottom', dy: -CUBESAT_H / 2, dx_range: [-CUBESAT_W / 2, CUBESAT_W / 2], dz_range: [-CUBESAT_D / 2, CUBESAT_D / 2] },
  ];

  if (type === 'grid') {
    // Standard structured mesh on long sides (Front, Back, Left, Right) and ends
    faces.forEach((face) => {
      // Different grid size depending on space
      const isSide = face.name === 'front' || face.name === 'back' || face.name === 'left' || face.name === 'right';
      const cols = isSide ? 3 : 2;
      const rows = isSide ? 6 : 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const u = rows > 1 ? (r / (rows - 1)) * 2 - 1 : 0; // -1 to 1
          const v = cols > 1 ? (c / (cols - 1)) * 2 - 1 : 0; // -1 to 1

          let x = 0;
          let y = 0;
          let z = 0;

          if (face.name === 'front' || face.name === 'back') {
            x = v * (CUBESAT_W / 2 - 2);
            y = u * (CUBESAT_H / 2 - 4);
            z = face.dz || 0;
          } else if (face.name === 'right' || face.name === 'left') {
            x = face.dx || 0;
            y = u * (CUBESAT_H / 2 - 4);
            z = v * (CUBESAT_D / 2 - 2);
          } else if (face.name === 'top' || face.name === 'bottom') {
            x = u * (CUBESAT_W / 2 - 2);
            y = face.dy || 0;
            z = v * (CUBESAT_D / 2 - 2);
          }

          // Reliability ranges. Outer face corners are slightly more prone to thermal fatigue (0.85), inner are 0.95
          const reliability = 0.85 + Math.random() * 0.12;

          nodes.push({
            id: `node-${idCounter++}`,
            x,
            y,
            z,
            state: 'active',
            baseRadius: sensingRange,
            currentRadius: sensingRange,
            workload: 40 + Math.random() * 10,
            reliability,
            failureCount: 0,
            assignedComrades: [],
            supportingNodes: [],
          });
        }
      }
    });
  } else if (type === 'hexagonal') {
    // Honeycomb-inspired staggered coordinates on the faces
    faces.forEach((face) => {
      const isSide = face.name === 'front' || face.name === 'back' || face.name === 'left' || face.name === 'right';
      const rows = isSide ? 7 : 3;
      
      for (let r = 0; r < rows; r++) {
        const u = (r / (rows - 1)) * 2 - 1; // -1 to 1
        // Staggered columns
        const cols = (r % 2 === 0) ? 3 : 2;
        for (let c = 0; c < cols; c++) {
          const offset = r % 2 === 0 ? 0 : 0.2;
          const v = (cols > 1 ? (c / (cols - 1)) * 1.6 - 0.8 : 0) + offset;

          let x = 0;
          let y = 0;
          let z = 0;

          if (face.name === 'front' || face.name === 'back') {
            x = v * (CUBESAT_W / 2 - 2);
            y = u * (CUBESAT_H / 2 - 4);
            z = face.dz || 0;
          } else if (face.name === 'right' || face.name === 'left') {
            x = face.dx || 0;
            y = u * (CUBESAT_H / 2 - 4);
            z = v * (CUBESAT_D / 2 - 2);
          } else if (face.name === 'top' || face.name === 'bottom') {
            x = u * (CUBESAT_W / 2 - 2);
            y = face.dy || 0;
            z = v * (CUBESAT_D / 2 - 2);
          }

          nodes.push({
            id: `node-${idCounter++}`,
            x,
            y,
            z,
            state: 'active',
            baseRadius: sensingRange * 1.1, // Hex yields slightly larger spacing
            currentRadius: sensingRange * 1.1,
            workload: 35 + Math.random() * 10,
            reliability: 0.87 + Math.random() * 0.1,
            failureCount: 0,
            assignedComrades: [],
            supportingNodes: [],
          });
        }
      }
    });
  } else if (type === 'random') {
    // Simulates an unstructured or clustered array
    const totalSensorNodes = 28;
    for (let i = 0; i < totalSensorNodes; i++) {
      // Pick a random face
      const faceIndex = Math.floor(Math.random() * faces.length);
      const face = faces[faceIndex];

      let x = 0;
      let y = 0;
      let z = 0;

      const randomU = Math.random() * 2 - 1; // -1 to 1
      const randomV = Math.random() * 2 - 1; // -1 to 1

      if (face.name === 'front' || face.name === 'back') {
        x = randomU * (CUBESAT_W / 2 - 2);
        y = randomV * (CUBESAT_H / 2 - 4);
        z = face.dz || 0;
      } else if (face.name === 'right' || face.name === 'left') {
        x = face.dx || 0;
        y = randomU * (CUBESAT_H / 2 - 4);
        z = randomV * (CUBESAT_D / 2 - 2);
      } else if (face.name === 'top' || face.name === 'bottom') {
        x = randomU * (CUBESAT_W / 2 - 2);
        y = face.dy || 0;
        z = randomV * (CUBESAT_D / 2 - 2);
      }

      nodes.push({
        id: `node-${idCounter++}`,
        x,
        y,
        z,
        state: 'active',
        baseRadius: sensingRange,
        currentRadius: sensingRange,
        workload: 40,
        reliability: 0.8 + Math.random() * 0.18,
        failureCount: 0,
        assignedComrades: [],
        supportingNodes: [],
      });
    }
  } else if (type === 'fractal') {
    // Neural-Fractal branching tree: connects standard clusters hierarchically to the core
    // Creates a self-similar fractal pattern on the faces
    faces.forEach((face) => {
      // Major hubs on each face
      const isSide = face.name === 'front' || face.name === 'back' || face.name === 'left' || face.name === 'right';
      const hubCount = isSide ? 3 : 1;

      for (let h = 0; h < hubCount; h++) {
        const u = hubCount > 1 ? (h / (hubCount - 1)) * 1.5 - 0.75 : 0;
        
        let hx = 0, hy = 0, hz = 0;
        if (face.name === 'front' || face.name === 'back') {
          hx = 0;
          hy = u * (CUBESAT_H / 4);
          hz = face.dz || 0;
        } else if (face.name === 'right' || face.name === 'left') {
          hx = face.dx || 0;
          hy = u * (CUBESAT_H / 4);
          hz = 0;
        } else {
          hx = 0;
          hy = face.dy || 0;
          hz = 0;
        }

        const hubId = `node-${idCounter++}`;
        nodes.push({
          id: hubId,
          x: hx,
          y: hy,
          z: hz,
          state: 'active',
          baseRadius: sensingRange * 1.3, // Regional routing hubs have higher capability
          currentRadius: sensingRange * 1.3,
          workload: 50,
          reliability: 0.92,
          failureCount: 0,
          assignedComrades: [],
          supportingNodes: [],
        });

        // 4 smaller leaf sensors branched around this Hub (Neural plasticity tree)
        const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
        const dist = 8;
        angles.forEach((angle) => {
          let lx = hx;
          let ly = hy;
          let lz = hz;

          if (face.name === 'front' || face.name === 'back') {
            lx += Math.cos(angle) * dist;
            ly += Math.sin(angle) * dist * 1.5;
          } else if (face.name === 'right' || face.name === 'left') {
            ly += Math.sin(angle) * dist * 1.5;
            lz += Math.cos(angle) * dist;
          } else {
            lx += Math.cos(angle) * dist;
            lz += Math.sin(angle) * dist;
          }

          // Bound coordinates inside face ranges
          lx = Math.max(-CUBESAT_W / 2 + 1.5, Math.min(CUBESAT_W / 2 - 1.5, lx));
          ly = Math.max(-CUBESAT_H / 2 + 1.5, Math.min(CUBESAT_H / 2 - 1.5, ly));
          lz = Math.max(-CUBESAT_D / 2 + 1.5, Math.min(CUBESAT_D / 2 - 1.5, lz));

          nodes.push({
            id: `node-${idCounter++}`,
            x: lx,
            y: ly,
            z: lz,
            state: 'active',
            baseRadius: sensingRange * 0.9,
            currentRadius: sensingRange * 0.9,
            workload: 30,
            reliability: 0.82 + Math.random() * 0.15,
            failureCount: 0,
            assignedComrades: [],
            supportingNodes: [],
          });
        });
      }
    });
  }

  // Pre-calculate comrades (spatial neighbors that act as backups)
  // Two nodes are comrades if the absolute Euclid distance is within an interactive range
  nodes.forEach((n1) => {
    const backupComrades: string[] = [];
    nodes.forEach((n2) => {
      if (n1.id !== n2.id && n2.id !== CORE_NODE_ID) {
        const d = calculate3DDistance(n1, n2);
        // If they are reasonably close, they monitor each other for failure redirection
        if (d < sensingRange * 1.8) {
          backupComrades.push(n2.id);
        }
      }
    });
    n1.assignedComrades = backupComrades;
  });

  return nodes;
}

/**
 * Calculates straight Euclidean distance in 3D
 */
export function calculate3DDistance(
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number }
): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Generates communication edges between nodes under commRange limit
 */
export function generateEdges(
  nodes: SensorNode[],
  commRange: number
): CommunicationEdge[] {
  const edges: CommunicationEdge[] = [];
  const added = new Set<string>();

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const n1 = nodes[i];
      const n2 = nodes[j];

      const d = calculate3DDistance(n1, n2);
      if (d <= commRange) {
        const edgeId = `${n1.id}_${n2.id}`;
        edges.push({
          id: edgeId,
          source: n1.id,
          target: n2.id,
          state: 'active',
          latency: Math.max(1, Math.round(d / 4)), // latency scaled with distance
        });
        added.add(edgeId);
      }
    }
  }

  return edges;
}

/**
 * Main self-healing calculation pipeline
 * 1. Resets node configurations (currentRadius, workload, supportingNodes)
 * 2. Marks broken edges (connected to failed nodes)
 * 3. Expands coverage radius for active comrades of failed nodes to cover blind spots
 * 4. Reroutes connectivity paths by finding alternative routes back to Core Node 0
 */
export function computeSelfHealing(
  nodes: SensorNode[],
  edges: CommunicationEdge[],
  healingFactor: number,
  commRange: number
): {
  healedNodes: SensorNode[];
  healedEdges: CommunicationEdge[];
  reconnectionRate: number; // Percentage of active nodes connected to core
} {
  // Allocate fresh clones to avoid side-effects
  const healedNodes = nodes.map((node) => ({
    ...node,
    currentRadius: node.baseRadius,
    workload: node.state === 'active' ? 40 : 0,
    supportingNodes: [],
  }));

  const healedEdges = edges.map((e) => {
    e.state = 'active';
    return e;
  });

  // Identify failed nodes
  const failedNodes = healedNodes.filter((n) => n.state === 'failed');

  // Trigger Edge Breakages (any connection touching a failed node goes offline)
  healedEdges.forEach((edge) => {
    const sNode = healedNodes.find((n) => n.id === edge.source);
    const tNode = healedNodes.find((n) => n.id === edge.target);
    if (!sNode || !tNode || sNode.state === 'failed' || tNode.state === 'failed') {
      edge.state = 'broken';
    }
  });

  // distributed recursive sensing area adaptation (Coverage Healing)
  failedNodes.forEach((failed) => {
    // Locate immediate healthy comrades monitoring this node
    const activeComrades = healedNodes.filter(
      (n) => n.state === 'active' && failed.assignedComrades.includes(n.id)
    );

    if (activeComrades.length > 0) {
      // Redistribute workload and broaden operational range
      const addedWorkloadShare = Math.round(50 / activeComrades.length);

      activeComrades.forEach((comrade) => {
        // Increase spatial coverage range to compensate for the failed sensor!
        // Distributed compensation formula based on shared workload burden
        const boostMultiplier = 1 + (healingFactor - 1) * (1.2 / activeComrades.length);
        comrade.currentRadius = Math.max(
          comrade.currentRadius,
          comrade.baseRadius * Math.min(healingFactor, boostMultiplier)
        );

        // Raise node's telemetry workload
        comrade.workload = Math.min(95, comrade.workload + addedWorkloadShare);
        comrade.state = 'healing'; // Highlight custom action state
        comrade.supportingNodes.push(failed.id);
      });
    }
  });

  // Recalculate communication paths through graph theory search (Dijkstra-BF)
  // We want to find if surviving nodes can route telemetry packets to CORE_NODE_ID
  const adjList = new Map<string, string[]>();
  healedNodes.forEach((n) => {
    if (n.state !== 'failed') {
      adjList.set(n.id, []);
    }
  });

  healedEdges.forEach((e) => {
    if (e.state === 'active') {
      if (adjList.has(e.source)) adjList.get(e.source)?.push(e.target);
      if (adjList.has(e.target)) adjList.get(e.target)?.push(e.source);
    }
  });

  // BFS to find connectivity and routing path hops back to CORE
  const connectedToCore = new Set<string>();
  const parentMap = new Map<string, string>();
  const queue: string[] = [];

  if (adjList.has(CORE_NODE_ID)) {
    connectedToCore.add(CORE_NODE_ID);
    queue.push(CORE_NODE_ID);
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const neighbors = adjList.get(curr) || [];
    for (const neighbor of neighbors) {
      if (!connectedToCore.has(neighbor)) {
        connectedToCore.add(neighbor);
        parentMap.set(neighbor, curr);
        queue.push(neighbor);
      }
    }
  }

  // Highlight routing paths: Mark active communication links forming the routing tree as 'rerouted' if they represent dynamic backup routes
  healedEdges.forEach((e) => {
    if (e.state === 'active') {
      // If the link is actively being used for routing back to the core, let's keep it healthy
      // We can designate edges as 'rerouted' if the source/target uses this edge to reach core and it's not the primary shortest-hop direct link
      const isRoutingEdge =
        parentMap.get(e.source) === e.target || parentMap.get(e.target) === e.source;
      
      if (isRoutingEdge) {
        // Check if distance is fairly long, which means it represents an dynamic fallback hop
        const nodeSrc = healedNodes.find(n => n.id === e.source);
        const nodeDst = healedNodes.find(n => n.id === e.target);
        if (nodeSrc && nodeDst && calculate3DDistance(nodeSrc, nodeDst) > commRange * 0.72) {
          e.state = 'rerouted';
        }
      }
    }
  });

  // Calculate percentage of active nodes that are successfully routed back to telemetry computer
  const totalActiveSensors = healedNodes.filter(
    (n) => n.id !== CORE_NODE_ID && n.state !== 'failed'
  ).length;

  const connectedActiveSensors = healedNodes.filter(
    (n) => n.id !== CORE_NODE_ID && n.state !== 'failed' && connectedToCore.has(n.id)
  ).length;

  const reconnectionRate =
    totalActiveSensors > 0
      ? (connectedActiveSensors / totalActiveSensors) * 100
      : 100;

  return {
    healedNodes,
    healedEdges,
    reconnectionRate,
  };
}

/**
 * Approximates high-fidelity spatial sensing coverage persistence inside a region
 * We overlay a 2D projection or evaluate a fine grid mesh on the CubeSat skin
 * returns coverage fraction: (0.0 to 1.0) for both conventional and selfHealing modes
 */
export function calculateCoveragePersistence(
  nodes: SensorNode[],
  healingFactor: number
): {
  persistenceSelfHealing: number;
  persistenceConventional: number;
} {
  // We evaluate 144 probe points distributed across CubeSat faces to measure local detection capability
  // Each active node provides detection capability exp(-dist^2 / 2r^2)
  // Probe points can correspond to a uniform sampling of the 3D surface
  // Standard (Conventional) assumes range factor = 1.0 (baseRadius) and dead sensors remain completely uncovered
  const probePoints: { x: number; y: number; z: number }[] = [];
  const spacingX = CUBESAT_W / 4;
  const spacingY = CUBESAT_H / 10;
  const spacingZ = CUBESAT_D / 4;

  // Let's create probes on front, back, right, left, top and bottom faces
  const hw = CUBESAT_W / 2;
  const hh = CUBESAT_H / 2;
  const hd = CUBESAT_D / 2;

  // Face front/back probes
  for (let x = -hw + 2; x <= hw - 2; x += spacingX) {
    for (let y = -hh + 3; y <= hh - 3; y += spacingY) {
      probePoints.push({ x, y, z: hd });
      probePoints.push({ x, y, z: -hd });
    }
  }

  // Face left/right probes
  for (let z = -hd + 2; z <= hd - 2; z += spacingZ) {
    for (let y = -hh + 3; y <= hh - 3; y += spacingY) {
      probePoints.push({ x: -hw, y, z });
      probePoints.push({ x: hw, y, z });
    }
  }

  let coveredSelfHealingCount = 0;
  let coveredConventionalCount = 0;

  // A probe is deemed "covered" if the combined sensing signal from active nodes exceeds a threshold (0.45)
  probePoints.forEach((probe) => {
    let intensitySelfHealing = 0;
    let intensityConventional = 0;

    nodes.forEach((node) => {
      if (node.id === CORE_NODE_ID) return; // Core node doesn't act as field sensor

      const dist = calculate3DDistance(node, probe);

      // Conventional evaluation (only active, no boosted range)
      if (node.state !== 'failed') {
        const thresholdRadiusConv = node.baseRadius;
        if (dist <= thresholdRadiusConv) {
          const strength = Math.exp(-Math.pow(dist / (thresholdRadiusConv * 0.7), 2));
          intensityConventional += strength;
        }

        // Self-Healing Evaluation (boosted range if comrade of a failed node)
        // If the node has expanded to support failed neighbors, its currentRadius is larger
        const isSupporting = node.supportingNodes.length > 0;
        const currentRadius = isSupporting
          ? Math.max(node.baseRadius, node.currentRadius)
          : node.baseRadius;

        if (dist <= currentRadius) {
          const strength = Math.exp(-Math.pow(dist / (currentRadius * 0.7), 2));
          intensitySelfHealing += strength;
        }
      }
    });

    if (intensityConventional >= 0.35) coveredConventionalCount++;
    if (intensitySelfHealing >= 0.35) coveredSelfHealingCount++;
  });

  const totalPoints = probePoints.length;

  return {
    persistenceConventional: totalPoints > 0 ? (coveredConventionalCount / totalPoints) * 100 : 100,
    persistenceSelfHealing: totalPoints > 0 ? (coveredSelfHealingCount / totalPoints) * 100 : 100,
  };
}

/**
 * Multi-layer 3D projection of a coordinate point onto 2D viewport
 */
export function project3DPoint(
  x: number,
  y: number,
  z: number,
  pitch: number, // Rotation X
  yaw: number,   // Rotation Y
  width: number,
  height: number,
  zoom: number = 2.8
): { x2d: number; y2d: number; depth: number } {
  // 1. Rotate around Y-axis (Yaw)
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = x * cosY - z * sinY;
  const z1 = x * sinY + z * cosY;

  // 2. Rotate around X-axis (Pitch)
  const cosX = Math.cos(pitch);
  const sinX = Math.sin(pitch);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

  // Perspective coefficients scale
  const perspectiveScale = 300 / (300 + z2);
  const x2d = width / 2 + x1 * zoom * perspectiveScale;
  const y2d = height / 2 - y2 * zoom * perspectiveScale;

  return {
    x2d,
    y2d,
    depth: z2, // Keep depth for painters sorting algorithm
  };
}

/**
 * Returns CubeSat wireframe panels mapped by depth for correct 2.5D visual rendering ordering
 */
export interface WireframeFace {
  name: string;
  points: { x: number; y: number; z: number }[];
  centerZ: number;
}

export function drawCubeSatWireframe(
  pitch: number,
  yaw: number,
  width: number,
  height: number
): WireframeFace[] {
  const w = CUBESAT_W / 2;
  const h = CUBESAT_H / 2;
  const d = CUBESAT_D / 2;

  // 8 vertices of the 3U CubeSat
  const vertices = {
    FTL: { x: -w, y: h, z: d },  // Front Top Left
    FTR: { x: w, y: h, z: d },   // Front Top Right
    FBL: { x: -w, y: -h, z: d }, // Front Bottom Left
    FBR: { x: w, y: -h, z: d },  // Front Bottom Right
    BTL: { x: -w, y: h, z: -d },  // Back Top Left
    BTR: { x: w, y: h, z: -d },   // Back Top Right
    BBL: { x: -w, y: -h, z: -d }, // Back Bottom Left
    BBR: { x: w, y: -h, z: -d },  // Back Bottom Right
  };

  const faces = [
    {
      name: 'front',
      points: [vertices.FTL, vertices.FTR, vertices.FBR, vertices.FBL],
    },
    {
      name: 'back',
      points: [vertices.BTR, vertices.BTL, vertices.BBL, vertices.BBR],
    },
    {
      name: 'left',
      points: [vertices.BTL, vertices.FTL, vertices.FBL, vertices.BBL],
    },
    {
      name: 'right',
      points: [vertices.FTR, vertices.BTR, vertices.BBR, vertices.FBR],
    },
    {
      name: 'top',
      points: [vertices.BTL, vertices.BTR, vertices.FTR, vertices.FTL],
    },
    {
      name: 'bottom',
      points: [vertices.FBL, vertices.FBR, vertices.BBR, vertices.BBL],
    },
  ];

  // Rotate and calculate median depth for painter sort
  const calculatedFaces = faces.map((face) => {
    let sumZ = 0;
    const rotatedPoints = face.points.map((p) => {
      // Find rotated values
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const x1 = p.x * cosY - p.z * sinY;
      const z1 = p.x * sinY + p.z * cosY;

      const cosX = Math.cos(pitch);
      const sinX = Math.sin(pitch);
      const z2 = p.y * sinX + z1 * cosX;
      sumZ += z2;
      return p;
    });

    return {
      name: face.name,
      points: rotatedPoints,
      centerZ: sumZ / 4,
    };
  });

  // Sort back to front (painter algorithm)
  return calculatedFaces.sort((a, b) => b.centerZ - a.centerZ);
}
