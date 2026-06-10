/**
 * TypeScript types for the Self-Healing CubeSat Sensor Topology Simulator.
 */

export type NodeState = 'active' | 'failed' | 'degraded' | 'healing';

export interface SensorNode {
  id: string;
  x: number; // 0 to 100 grid coords
  y: number; // 0 to 100 grid coords
  z: number; // Coords inside 3D space for projection
  state: NodeState;
  baseRadius: number; // Base coverage range
  currentRadius: number; // Boosted coverage range to heal failure
  workload: number; // Workload allocated to this node (e.g. 0 to 100%)
  reliability: number; // Initial health value (0.0 to 1.0)
  failureCount: number; // Ticks failed
  assignedComrades: string[]; // Neighbor IDs this node is monitoring/ready to support
  supportingNodes: string[]; // Nodes that are currently expanding to cover this node if it failed
  remainingEnergy?: number; // 0 to 100%
  reliabilityHistory?: number; // 0.0 to 1.0
}

export interface CommunicationEdge {
  id: string;
  source: string; // node ID
  target: string; // node ID
  state: 'active' | 'broken' | 'rerouted';
  latency: number; // Communication latency
}

export type TopologyType = 'grid' | 'hexagonal' | 'random' | 'fractal';

export interface MetricsHistoryEntry {
  step: number;
  coveragePersistenceSelfHealing: number;
  coveragePersistenceConventional: number;
  connectivityRatioSelfHealing: number;
  connectivityRatioConventional: number;
  failuresCount: number;
  pdrSelfHealing: number;
  pdrConventional: number;
  energySelfHealing: number;
  energyConventional: number;
  latencySelfHealing: number;
}

export interface RecoveryEvent {
  nodeId: string;
  failureTime: number;
  detectionTime: number;
  recoveryTime: number;
  latency: number;
}

export interface BenchmarkResult {
  algorithm: string;
  connectivity: number;
  coverage: number;
  pdr: number;
  recoveryTime: number;
  energy: number;
}

export interface MonteCarloStats {
  mean: number;
  median: number;
  stdDev: number;
  confIntervalMin: number;
  confIntervalMax: number;
  sd: number; // Dashboard expects .sd for Standard Deviation
  ci: [number, number]; // Dashboard expects .ci as [min, max] array
}

export interface MonteCarloReport {
  runsCount: number;
  totalRuns: number; // Dashboard expects totalRuns
  connectivity: MonteCarloStats;
  coverage: MonteCarloStats;
  pdr: MonteCarloStats;
  recoveryTime: MonteCarloStats;
  latency: MonteCarloStats; // Dashboard expects latency instead of recoveryTime
  energy: MonteCarloStats;
}

export interface DegradationPoint {
  damage?: number; // Support dashboard `.damage` key
  damageLevel: number; // 0 to 90%
  conventionalConnectivity: number;
  selfHealingConnectivity: number;
  conventionalCoverage: number;
  selfHealingCoverage: number;
  conventionalPDR: number;
  selfHealingPDR: number;
  conventionalEnergy: number;
  selfHealingEnergy: number;
  conventionalRecovery: number;
  selfHealingRecovery: number;

  // Visualizer aliases
  connectivityConventional?: number;
  connectivitySelfHealing?: number;
  coverageConventional?: number;
  coverageSelfHealing?: number;
  pdrConventional?: number;
  pdrSelfHealing?: number;
  energyConventional?: number;
  energySelfHealing?: number;
}

export interface SimulationConfig {
  topologyType: TopologyType;
  commRange: number; // Connection distance threshold
  sensingRange: number; // Default sensing range
  healingFactor: number; // Max multiplication of sensing range for healing (e.g. 1.5x)
  redundancyLevel: number; // Number of redundant backup nodes per region
  failureProbability: number; // Random failure rate per step
  autoHealEnabled: boolean;
}

