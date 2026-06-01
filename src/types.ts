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

export interface UserAchievement {
  id: string;
  unlockedAt: string;
}

export interface UserProfile {
  username: string;
  callsign: string;
  level: number;
  xp: number;
  achievements: UserAchievement[];
  customSectorName: string;
  autoCenterView: boolean;
  gridOpacity: number;
  lastLoginAt: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  badgeSymbol: string;
  category: 'onboarding' | 'scenarios' | 'topology' | 'limits';
  xpReward: number;
}

