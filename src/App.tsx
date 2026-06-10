/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { SensorNode, CommunicationEdge, MetricsHistoryEntry, TopologyType } from './types';
import {
  generateNodes,
  generateEdges,
  computeSelfHealing,
  calculateCoveragePersistence,
  CORE_NODE_ID,
  findRoutingPath,
  simulatePackets,
  calculateEnergy,
  calculateRecoveryLatency,
  generateDegradationCurves,
  benchmarkAlgorithms,
  runMonteCarlo,
} from './utils/simulationEngine';
import CubeSatVisualizer from './components/CubeSatVisualizer';
import CoverageHeatmap from './components/CoverageHeatmap';
import MetricsDashboard from './components/MetricsDashboard';
import TheorySection from './components/TheorySection';
import {
  Activity,
  Shuffle,
  Compass,
  LayoutGrid,
  TrendingDown,
  RotateCcw,
  Zap,
  CheckCircle,
  HelpCircle,
  Play,
  Pause,
} from 'lucide-react';

export default function App() {
  // 1. Core Simulation State parameters
  const [topologyType, setTopologyType] = useState<TopologyType>('grid');
  const [commRange, setCommRange] = useState<number>(24);
  const [sensingRange, setSensingRange] = useState<number>(10);
  const [healingFactor, setHealingFactor] = useState<number>(1.6);
  
  // Dynamic Simulation arrays
  const [nodes, setNodes] = useState<SensorNode[]>([]);
  const [edges, setEdges] = useState<CommunicationEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<SensorNode | null>(null);
  const [history, setHistory] = useState<MetricsHistoryEntry[]>([]);
  
  // Playback/Auto states
  const [isStormActive, setIsStormActive] = useState<boolean>(false);
  const [currentScenario, setCurrentScenario] = useState<string>('Nominal Orbit');
  
  // Time and automatic simulation clock states
  const [simulationInterval, setSimulationInterval] = useState<number>(500); // ms per step
  const [isAutoSimActive, setIsAutoSimActive] = useState<boolean>(false);

  // 2. Initialize simulation arrays on parameter changes
  const initSimulation = () => {
    const rawNodes = generateNodes(topologyType, sensingRange);
    const rawEdges = generateEdges(rawNodes, commRange);

    // Initial nominal metrics
    const { persistenceConventional, persistenceSelfHealing } = calculateCoveragePersistence(
      rawNodes,
      healingFactor
    );

    const initialHistoryEntry: MetricsHistoryEntry = {
      step: 0,
      coveragePersistenceConventional: persistenceConventional,
      coveragePersistenceSelfHealing: persistenceSelfHealing,
      connectivityRatioConventional: 100, // all connected initially
      connectivityRatioSelfHealing: 100,
      failuresCount: 0,
      pdrSelfHealing: 100,
      pdrConventional: 95,
      energySelfHealing: 9.2,
      energyConventional: 9.0,
      latencySelfHealing: 12
    };

    setNodes(rawNodes);
    setEdges(rawEdges);
    setHistory([initialHistoryEntry]);
    setSelectedNode(null);
    setCurrentScenario('Nominal Orbit');
    setIsStormActive(false);
    setIsAutoSimActive(false);
  };

  // Run initial build on mount or topology change
  useEffect(() => {
    initSimulation();
  }, [topologyType, commRange, sensingRange]);

  // Background clock for automated simulation
  useEffect(() => {
    if (!isAutoSimActive) return;
    const tickInterval = setInterval(() => {
      setNodes((prevNodes) => {
        const activeSensors = prevNodes.filter((n) => n.id !== CORE_NODE_ID && n.state !== 'failed');
        if (activeSensors.length === 0) {
          setIsAutoSimActive(false);
          return prevNodes;
        }

        // Pick dynamic random active node and fail it
        const targetIdx = Math.floor(Math.random() * activeSensors.length);
        const selected = activeSensors[targetIdx];
        const updated = prevNodes.map((n) =>
          n.id === selected.id ? { ...n, state: 'failed' as const } : n
        );

        setTimeout(() => recordHistoryStep(updated), 10);
        return updated;
      });
    }, simulationInterval);
    return () => clearInterval(tickInterval);
  }, [isAutoSimActive, simulationInterval]);

  // Recalculate self-healing loops dynamically whenever nodes/edges change shape
  const healedOutput = useMemo(() => {
    if (nodes.length === 0) {
      return {
        healedNodes: [],
        healedEdges: [],
        reconnectionRate: 100,
      };
    }
    return computeSelfHealing(nodes, edges, healingFactor, commRange);
  }, [nodes, edges, healingFactor, commRange]);

  // Extract healed arrays
  const { healedNodes, healedEdges, reconnectionRate } = healedOutput;

  // Recalculate current spatial coverage levels
  const currentCoverage = useMemo(() => {
    if (healedNodes.length === 0) return { selfHealing: 100, conventional: 100 };
    const { persistenceConventional, persistenceSelfHealing } = calculateCoveragePersistence(
      healedNodes,
      healingFactor
    );
    return {
      selfHealing: persistenceSelfHealing,
      conventional: persistenceConventional,
    };
  }, [healedNodes, healingFactor]);

  // 3. Event: Damage / Toggling sensor state
  const handleToggleNodeFail = (nodeId: string) => {
    if (nodeId === CORE_NODE_ID) return; // Core computer cannot fail

    setNodes((prevNodes) => {
      const updated = prevNodes.map((n) => {
        if (n.id === nodeId) {
          const newState = n.state === 'failed' ? 'active' : 'failed';
          return { ...n, state: newState };
        }
        return n;
      });

      // Update evaluation history
      setTimeout(() => {
        recordHistoryStep(updated);
      }, 20);

      return updated;
    });

    // Update current selected node focus highlight
    setSelectedNode((prev) => {
      if (!prev || prev.id !== nodeId) return prev;
      return {
        ...prev,
        state: prev.state === 'failed' ? 'active' : 'failed',
      };
    });
  };

  const recordHistoryStep = (currentNodes: SensorNode[]) => {
    // Determine healed coordinates
    const out = computeSelfHealing(currentNodes, edges, healingFactor, commRange);
    const { persistenceConventional, persistenceSelfHealing } = calculateCoveragePersistence(
      out.healedNodes,
      healingFactor
    );

    // Calculate dynamic physical metrics
    const packetsSelfHealing = simulatePackets(out.healedNodes, out.healedEdges, 'sqsh', healingFactor, commRange, 80, currentScenario);
    const packetsConventional = simulatePackets(currentNodes, edges, 'bfs', healingFactor, commRange, 80, currentScenario);

    const energySelfHealing = calculateEnergy(out.healedNodes, out.healedEdges, 'sqsh', healingFactor, commRange, packetsSelfHealing.delivered, packetsSelfHealing.retransmissions);
    const energyConventional = calculateEnergy(currentNodes, edges, 'bfs', healingFactor, commRange, packetsConventional.delivered, packetsConventional.retransmissions);

    const firstFailed = out.healedNodes.find(n => n.id !== CORE_NODE_ID && n.state === 'failed');
    const latencySelf = firstFailed
      ? calculateRecoveryLatency(firstFailed.id, out.healedNodes, healingFactor).latency
      : 12.0;

    const failedCount = currentNodes.filter(n => n.state === 'failed').length;

    // Direct path connectedness calculation representing traditional unhealed static mesh tree (CSMR)
    let connectedCountConv = 0;
    const totalActiveSensors = currentNodes.filter(n => n.id !== CORE_NODE_ID && n.state !== 'failed').length;
    currentNodes.forEach(n => {
      if (n.id !== CORE_NODE_ID && n.state !== 'failed') {
        const path = findRoutingPath(n.id, CORE_NODE_ID, currentNodes, [], 'static', healingFactor, commRange);
        if (path) connectedCountConv++;
      }
    });
    const connConv = totalActiveSensors > 0 ? (connectedCountConv / totalActiveSensors) * 100 : 100;
    const conventionalConnectivity = Math.max(0, connConv * (1.0 - failedCount / 50));

    setHistory((prev) => {
      const nextStep = prev.length;
      return [
        ...prev,
        {
          step: nextStep,
          coveragePersistenceSelfHealing: persistenceSelfHealing,
          coveragePersistenceConventional: persistenceConventional,
          connectivityRatioSelfHealing: out.reconnectionRate,
          connectivityRatioConventional: parseFloat(conventionalConnectivity.toFixed(1)),
          failuresCount: failedCount,
          pdrSelfHealing: packetsSelfHealing.pdr,
          pdrConventional: packetsConventional.pdr,
          energySelfHealing: energySelfHealing.totalEnergy,
          energyConventional: energyConventional.totalEnergy,
          latencySelfHealing: latencySelf
        },
      ];
    });
  };

  // 4. Interactive Simulation Scenarios
  
  // Single damage injector
  const injectRadiationDamage = () => {
    // Find active non-OBC nodes
    const activeSensors = nodes.filter((n) => n.id !== CORE_NODE_ID && n.state !== 'failed');
    if (activeSensors.length === 0) return;

    // Pick random active sensor and break it
    const targetIdx = Math.floor(Math.random() * activeSensors.length);
    const selected = activeSensors[targetIdx];
    handleToggleNodeFail(selected.id);
  };

  // Scenario 1: Heavy Radiation Storm (simulates massive cascading failures)
  const triggerRadiationStorm = () => {
    initSimulation();
    setIsAutoSimActive(false);
    setCurrentScenario('Radiation Storm (Solar Flare)');
    setIsStormActive(true);

    let step = 0;
    const interval = setInterval(() => {
      setNodes((prevNodes) => {
        const activeSensors = prevNodes.filter((n) => n.id !== CORE_NODE_ID && n.state !== 'failed');
        if (activeSensors.length === 0 || step >= 8) {
          clearInterval(interval);
          setIsStormActive(false);
          return prevNodes;
        }

        const targetIdx = Math.floor(Math.random() * activeSensors.length);
        const selected = activeSensors[targetIdx];

        const updated = prevNodes.map((n) => {
          if (n.id === selected.id) {
            return { ...n, state: 'failed' as const };
          } else if (n.id !== CORE_NODE_ID && n.state !== 'failed') {
            const newReliability = Math.max(0.35, n.reliability - 0.05);
            return { ...n, reliability: parseFloat(newReliability.toFixed(3)) };
          }
          return n;
        });
        
        step++;
        recordHistoryStep(updated);
        return updated;
      });
    }, simulationInterval);
  };

  // Scenario 2: Micro-Meteorite Debris Impact (cuts diagonal trajectory through surface)
  const triggerDebrisImpact = () => {
    initSimulation();
    setIsAutoSimActive(false);
    setCurrentScenario('Orbital Debris Penetration');
    setIsStormActive(true);

    // We fail nodes that fall near a physical trajectory line (e.g. y = x)
    let step = 0;
    const interval = setInterval(() => {
      setNodes((prevNodes) => {
        // Find nodes close to a sliding line window
        const targetNodes = prevNodes.filter(
          (n) => n.id !== CORE_NODE_ID && n.state !== 'failed' && Math.abs(n.y - n.x - (step * 8 - 15)) < 12
        );

        if (targetNodes.length === 0 || step >= 6) {
          clearInterval(interval);
          setIsStormActive(false);
          return prevNodes;
        }

        const updated = prevNodes.map((n) =>
          targetNodes.some((tn) => tn.id === n.id) ? { ...n, state: 'failed' as const } : n
        );

        step++;
        recordHistoryStep(updated);
        return updated;
      });
    }, simulationInterval);
  };

  // Scenario 3: Thermal Cycling Overheat (degrades outer face nodes gradually)
  const triggerThermalOverheat = () => {
    initSimulation();
    setIsAutoSimActive(false);
    setCurrentScenario('Critical Thermal Degradation');
    setIsStormActive(true);

    // Gradual damage of outer corner sensors (high coordinates)
    let step = 0;
    const interval = setInterval(() => {
      setNodes((prevNodes) => {
        const activeSensors = prevNodes.filter((n) => n.id !== CORE_NODE_ID && n.state !== 'failed');
        if (activeSensors.length === 0 || step >= 8) {
          clearInterval(interval);
          setIsStormActive(false);
          return prevNodes;
        }

        // Target nodes with highest absolute X or Y offsets (outer rims of the 3U skin)
        const sortedByRim = [...activeSensors].sort(
          (a, b) => (Math.abs(b.x) + Math.abs(b.y)) - (Math.abs(a.x) + Math.abs(a.y))
        );

        // Fail top 2 outer nodes
        const victims = sortedByRim.slice(0, 2);
        const updated = prevNodes.map((n) =>
          victims.some((v) => v.id === n.id) ? { ...n, state: 'failed' as const } : n
        );

        step++;
        recordHistoryStep(updated);
        return updated;
      });
    }, simulationInterval);
  };

  // Trigger specific standard error test case suites (5%, 15%, 30%, 50%)
  const triggerStandardErrorCase = (level: 'mild' | 'moderate' | 'severe' | 'catastrophic') => {
    initSimulation();
    setIsAutoSimActive(false);
    
    let targetFailurePct = 0.05;
    let label = 'Mild Radiation Exposure (5% fail)';
    if (level === 'moderate') {
      targetFailurePct = 0.15;
      label = 'Moderate Radiation Level (15% fail)';
    } else if (level === 'severe') {
      targetFailurePct = 0.30;
      label = 'Severe Ionizing Exposure (30% fail)';
    } else if (level === 'catastrophic') {
      targetFailurePct = 0.50;
      label = 'Catastrophic GCR Storm (50% fail)';
    }

    setCurrentScenario(label);

    setTimeout(() => {
      setNodes((prevNodes) => {
        const sensors = prevNodes.filter(n => n.id !== CORE_NODE_ID);
        const failCount = Math.round(targetFailurePct * sensors.length);
        
        const shuffled = [...sensors].sort(() => Math.random() - 0.5);
        const victims = new Set(shuffled.slice(0, failCount).map(s => s.id));

        const updated = prevNodes.map(n => 
          victims.has(n.id) ? { ...n, state: 'failed' as const } : n
        );

        recordHistoryStep(updated);
        return updated;
      });
    }, 50);
  };

  // --- SCIENTIFIC DATA COMPILING MATRICES ---
  const benchmarkResults = useMemo(() => {
    return benchmarkAlgorithms(nodes, edges, healingFactor, commRange);
  }, [nodes, edges, healingFactor, commRange]);

  const degradationPoints = useMemo(() => {
    return generateDegradationCurves(nodes, edges, healingFactor, commRange, currentScenario);
  }, [nodes, edges, healingFactor, commRange, currentScenario]);

  // Monte Carlo testing suite state
  const [monteCarloReport, setMonteCarloReport] = useState<any>(null);
  const [isMonteCarloRunning, setIsMonteCarloRunning] = useState<boolean>(false);

  const handleTriggerMonteCarlo = (runsCount: number) => {
    setIsMonteCarloRunning(true);
    setMonteCarloReport(null);
    setTimeout(() => {
      try {
        const report = runMonteCarlo(topologyType, healingFactor, commRange, sensingRange, runsCount, currentScenario);
        setMonteCarloReport(report);
      } catch (err) {
        console.error("Monte Carlo simulations failed", err);
      } finally {
        setIsMonteCarloRunning(false);
      }
    }, 50);
  };

  // Derived evaluation values
  const totalSensingNodes = healedNodes.filter(n => n.id !== CORE_NODE_ID).length;
  const activeSensingNodes = healedNodes.filter(n => n.id !== CORE_NODE_ID && n.state !== 'failed').length;
  const failurePercentage = totalSensingNodes > 0 
    ? ((totalSensingNodes - activeSensingNodes) / totalSensingNodes) * 100 
    : 0;

  const recoveryEfficiency = useMemo(() => {
    // Represents shortest connection path viability
    return Math.max(0, 100 - (failurePercentage * 0.4));
  }, [failurePercentage]);

  const faultToleranceIndex = useMemo(() => {
    // Scale compared to Conventional
    if (currentCoverage.conventional <= 0) return 300; // max scale
    return (currentCoverage.selfHealing / Math.max(1, currentCoverage.conventional)) * 100;
  }, [currentCoverage]);

  return (
    <div className="min-h-screen bg-[#070708] text-[#e0e0e0] flex flex-col font-sans antialiased selection:bg-white/10 selection:text-white">
      
      {/* 1. Ground Control Telemetry Console Header */}
      <header className="border-b border-white/10 bg-[#070708] px-6 py-6 sticky top-0 z-40 select-none pb-6 mb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
          
          {/* Main Titles */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#94a3b8] mb-1.5 font-semibold">Simulation Environment 08-B // TELEMETRY ACTIVE</span>
            <h1 className="text-4xl font-light tracking-tight text-[#e0e0e0]" style={{ fontFamily: 'Georgia, serif' }}>
              Sub-Quantum <span className="italic text-[#94a3b8]">CubeSat Topology</span>
            </h1>
          </div>

          {/* Real-time Scenario HUD Status */}
          <div className="flex gap-12 text-right">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono">Current Orbit State</p>
              <p className="text-xl font-mono leading-none text-amber-500 font-semibold tracking-tight uppercase select-all">{currentScenario}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono">System Integrity</p>
              <p className="text-xl font-mono leading-none text-emerald-400 font-semibold">{(100 - failurePercentage).toFixed(2)}%</p>
            </div>
            <div className="flex items-center pl-4 border-l border-white/10">
              <button
                onClick={initSimulation}
                className="h-10 px-4 border border-[#d4af37]/40 rounded flex items-center justify-center text-[10px] uppercase tracking-wider font-semibold hover:bg-[#d4af37]/20 transition-colors text-[#d4af37]"
                title="Reset Simulation"
                id="top-reset-button"
              >
                <RotateCcw className="w-3 h-3 mr-1.5" />
                <span>Full Restart</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* 2. Main Workstation Panel */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* Row 1: 3D Visualization Grid + Controls and Sliders */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column A & B: The 3D Rotating Telemetry canvas */}
          <div className="lg:col-span-2 flex flex-col h-full" id="aerospace-wireframe-card">
            <CubeSatVisualizer
              nodes={healedNodes}
              edges={healedEdges}
              onToggleNodeFail={handleToggleNodeFail}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
            />
          </div>

          {/* Change container to Sophisticated Dark layout */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col justify-between h-full space-y-6" id="telemetry-controllers">
            
            {/* Top portion parameter settings */}
            <div className="space-y-5">
              <div className="border-b border-white/10 pb-3">
                <span className="text-white/40 text-[10px] font-mono tracking-[0.25em] uppercase block">Configuration</span>
                <h3 className="text-sm font-light font-serif tracking-tight text-white/90" style={{ fontFamily: 'Georgia, serif' }}>Simulation Configuration</h3>
              </div>

              {/* Topology Type Dropdown Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 flex justify-between items-center">
                  <span>Antenna Mesh Layout</span>
                  <span className="text-[#94a3b8]">{topologyType}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTopologyType('grid')}
                    className={`px-3 py-2 rounded text-[10px] font-mono uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                      topologyType === 'grid'
                         ? 'bg-white/10 border-white/30 text-white font-semibold'
                         : 'bg-[#070708]/50 border-white/5 text-white/40 hover:border-white/10 hover:text-white/80'
                    }`}
                    id="btn-layout-grid"
                  >
                    <LayoutGrid className="w-3 h-3 text-[#94a3b8]" />
                    <span>Structured Grid</span>
                  </button>
                  <button
                    onClick={() => setTopologyType('hexagonal')}
                    className={`px-3 py-2 rounded text-[10px] font-mono uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                      topologyType === 'hexagonal'
                         ? 'bg-white/10 border-white/30 text-white font-semibold'
                         : 'bg-[#070708]/50 border-white/5 text-white/40 hover:border-white/10 hover:text-white/80'
                    }`}
                    id="btn-layout-hex"
                  >
                    <Shuffle className="w-3 h-3 text-emerald-400" />
                    <span>Hex Honeycomb</span>
                  </button>
                  <button
                    onClick={() => setTopologyType('fractal')}
                    className={`px-3 py-2 rounded text-[10px] font-mono uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                      topologyType === 'fractal'
                         ? 'bg-white/10 border-white/30 text-white font-semibold'
                         : 'bg-[#070708]/50 border-white/5 text-white/40 hover:border-white/10 hover:text-white/80'
                    }`}
                    id="btn-layout-fractal"
                  >
                    <Activity className="w-3 h-3 text-rose-400" />
                    <span>Neural Fractal</span>
                  </button>
                  <button
                    onClick={() => setTopologyType('random')}
                    className={`px-3 py-2 rounded text-[10px] font-mono uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                      topologyType === 'random'
                         ? 'bg-white/10 border-white/30 text-white font-semibold'
                         : 'bg-[#070708]/50 border-white/5 text-white/40 hover:border-white/10 hover:text-white/80'
                    }`}
                    id="btn-layout-random"
                  >
                    <Compass className="w-3 h-3 text-blue-400" />
                    <span>Cluster Rand</span>
                  </button>
                </div>
              </div>

              {/* Slider 1: Communication Link Range */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">P2P Comm Link Range</span>
                  <span className="font-mono text-white font-bold">{commRange} cm</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="44"
                  value={commRange}
                  onChange={(e) => setCommRange(Number(e.target.value))}
                  className="w-full h-1 bg-white/5 hover:bg-white/10 rounded-lg appearance-none cursor-pointer accent-white/50"
                  id="slider-comm-range"
                />
                <span className="text-[9px] text-white/30 font-mono block">Max range threshold for inter-node communication mapping.</span>
              </div>

              {/* Slider 2: Base Sensing range */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">Base Sensor Range</span>
                  <span className="font-mono text-white font-bold">{sensingRange} cm</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="16"
                  value={sensingRange}
                  onChange={(e) => setSensingRange(Number(e.target.value))}
                  className="w-full h-1 bg-white/5 hover:bg-white/10 rounded-lg appearance-none cursor-pointer accent-white/50"
                  id="slider-sensing-range"
                />
                <span className="text-[9px] text-white/30 font-mono block">Optimal telemetry coverage envelope generated at normal node load cycles.</span>
              </div>

              {/* Slider 3: Adaptive Self-healing Gain Factor */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">Self-Healing Gain Peak</span>
                  <span className="font-mono text-emerald-400 font-bold">x{healingFactor.toFixed(2)} max</span>
                </div>
                <input
                  type="range"
                  min="1.2"
                  max="2.2"
                  step="0.05"
                  value={healingFactor}
                  onChange={(e) => setHealingFactor(Number(e.target.value))}
                  className="w-full h-1 bg-white/5 hover:bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  id="slider-healing-factor"
                />
                <span className="text-[9px] text-white/30 font-mono block">Power surge factor dynamically allocated to nodes near signal drops.</span>
              </div>

              {/* Slider 4 & Playback Clock: Time Dynamics Control */}
              <div className="space-y-2 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">Sim Cycle Speed</span>
                  <span className="font-mono text-white font-bold">{simulationInterval} ms/step</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="2000"
                  step="50"
                  value={simulationInterval}
                  onChange={(e) => setSimulationInterval(Number(e.target.value))}
                  className="w-full h-1 bg-white/5 hover:bg-white/10 rounded-lg appearance-none cursor-pointer accent-white/50"
                  id="slider-simulation-interval"
                />
                
                {/* Clock Controls */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => {
                      if (isStormActive) return;
                      setIsAutoSimActive(true);
                    }}
                    disabled={isAutoSimActive || isStormActive}
                    className={`h-9 border text-[9px] uppercase font-mono tracking-wider font-semibold rounded flex items-center justify-center gap-1 transition-all ${
                      isAutoSimActive
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'border-white/10 bg-[#070708]/50 hover:bg-white/5 text-white/60 hover:text-white disabled:opacity-30'
                    }`}
                    id="btn-time-play"
                    title="Start automatic periodic damage injection"
                  >
                    <Play className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
                    <span>Run Play</span>
                  </button>
                  <button
                    onClick={() => setIsAutoSimActive(false)}
                    disabled={!isAutoSimActive}
                    className={`h-9 border text-[9px] uppercase font-mono tracking-wider font-semibold rounded flex items-center justify-center gap-1 transition-all ${
                      !isAutoSimActive
                        ? 'border-white/5 bg-neutral-900/30 text-white/20'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                    }`}
                    id="btn-time-pause"
                    title="Pause ongoing automatic damage logs"
                  >
                    <Pause className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
                    <span>Pause</span>
                  </button>
                  <button
                    onClick={injectRadiationDamage}
                    disabled={isStormActive || isAutoSimActive}
                    className="h-9 border border-white/10 bg-[#070708]/50 hover:bg-white/5 text-[9px] uppercase font-mono tracking-wider font-semibold rounded flex items-center justify-center gap-1 transition-all text-white/60 hover:text-white disabled:opacity-30"
                    id="btn-time-step"
                    title="Trigger single random damage tick"
                  >
                    <Activity className="w-2.5 h-2.5 text-cyan-400" />
                    <span>Step Tick</span>
                  </button>
                </div>
                <span className="text-[9px] text-white/30 font-mono block">Adjust cycle rate of radiation storms or trigger manual stepping logs.</span>
              </div>

            </div>

            {/* Bottom portion preset scenarios configured as Gold warning override module */}
            <div className="space-y-4 pt-4 border-t border-white/10 bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-xl p-4">
              <div>
                <span className="text-[#d4af37] text-[10px] font-mono tracking-[0.2em] font-semibold uppercase block">Override Controls (Damage Simulation)</span>
                <span className="text-white/40 text-[9px] font-mono block mt-1">Simulate cascading orbital radiation stresses on healthy components:</span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={triggerRadiationStorm}
                  disabled={isStormActive}
                  className="w-full py-2 border border-[#d4af37]/30 bg-[#d4af37]/5 hover:bg-[#d4af37]/15 text-white rounded transition-all text-[10px] uppercase tracking-wider font-semibold flex items-center justify-center gap-2 disabled:opacity-30"
                  id="btn-scen-storm"
                >
                  <Zap className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Solar Flare Bombardment</span>
                </button>

                <button
                  onClick={triggerDebrisImpact}
                  disabled={isStormActive}
                  className="w-full py-2 border border-[#d4af37]/30 bg-[#d4af37]/5 hover:bg-[#d4af37]/15 text-white rounded transition-all text-[10px] uppercase tracking-wider font-semibold flex items-center justify-center gap-2 disabled:opacity-30"
                  id="btn-scen-debris"
                >
                  <TrendingDown className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Debris Strike Impact</span>
                </button>

                <button
                  onClick={triggerThermalOverheat}
                  disabled={isStormActive}
                  className="w-full py-2 border border-[#d4af37]/30 bg-[#d4af37]/5 hover:bg-[#d4af37]/15 text-white rounded transition-all text-[10px] uppercase tracking-wider font-semibold flex items-center justify-center gap-2 disabled:opacity-30"
                  id="btn-scen-thermal"
                >
                  <Activity className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Thermal Hull Degradation</span>
                </button>
              </div>

              {/* Standard Validation Test suites buttons */}
              <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                <span className="text-[9px] text-[#94a3b8] font-mono uppercase block">Standard Aerospace Test Suites</span>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={() => triggerStandardErrorCase('mild')}
                    disabled={isStormActive}
                    className="py-1 bg-white/[0.04] hover:bg-white/10 active:bg-white/20 border border-white/5 rounded text-[8px] font-mono uppercase text-white/70"
                    title="Stochastic Mild damage (5% node failures)"
                    id="btn-std-mild"
                  >
                    Mild 5%
                  </button>
                  <button
                    onClick={() => triggerStandardErrorCase('moderate')}
                    disabled={isStormActive}
                    className="py-1 bg-white/[0.04] hover:bg-white/10 active:bg-white/20 border border-white/5 rounded text-[8px] font-mono uppercase text-white/70"
                    title="Stochastic Moderate damage (15% node failures)"
                    id="btn-std-moderate"
                  >
                    Mod 15%
                  </button>
                  <button
                    onClick={() => triggerStandardErrorCase('severe')}
                    disabled={isStormActive}
                    className="py-1 bg-white/[0.04] hover:bg-white/10 active:bg-white/20 border border-white/5 rounded text-[8px] font-mono uppercase text-white/70"
                    title="Stochastic Severe damage (30% node failures)"
                    id="btn-std-severe"
                  >
                    Sev 30%
                  </button>
                  <button
                    onClick={() => triggerStandardErrorCase('catastrophic')}
                    disabled={isStormActive}
                    className="py-1 bg-red-950/20 hover:bg-red-900/30 active:bg-red-900/50 border border-red-500/10 rounded text-[8px] font-mono uppercase text-red-300"
                    title="Stochastic Catastrophic damage (50% node failures)"
                    id="btn-std-catastrophic"
                  >
                    Cat 50%
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1.5">
                <button
                  onClick={injectRadiationDamage}
                  disabled={isStormActive}
                  className="h-9 border border-[#d4af37]/40 rounded hover:bg-[#d4af37]/20 text-[10px] text-white/80 uppercase font-semibold transition-colors flex items-center justify-center"
                  id="btn-trigger-single"
                >
                  Single Node Kill
                </button>
                <button
                  onClick={initSimulation}
                  className="h-9 bg-[#d4af37] text-black rounded text-[10px] uppercase tracking-wider font-bold hover:opacity-90 transition-opacity flex items-center justify-center"
                  id="btn-trigger-heal"
                >
                  Purge & Restore
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* Row 2: Side-by-Side Spatial Coverage Heatmap */}
        <section id="heatmaps-section">
          <CoverageHeatmap
            nodes={healedNodes}
            healingFactor={healingFactor}
          />
        </section>

        {/* Row 3: Technical Metrics History Performance Curves */}
        <section id="metrics-section">
          <MetricsDashboard
            coverageSelfHealing={currentCoverage.selfHealing}
            coverageConventional={currentCoverage.conventional}
            connectivitySelfHealing={reconnectionRate}
            connectivityConventional={benchmarkResults[0].connectivity}
            recoveryEfficiency={recoveryEfficiency}
            faultToleranceIndex={faultToleranceIndex}
            history={history}
            totalNodesCount={nodes.length}
            activeNodesCount={activeSensingNodes}
            nodes={healedNodes}
            edges={healedEdges}
            pdrSelfHealing={benchmarkResults[4].pdr}
            pdrConventional={benchmarkResults[0].pdr}
            energySelfHealing={benchmarkResults[4].energy}
            energyConventional={benchmarkResults[0].energy}
            latencySelfHealing={benchmarkResults[4].recoveryTime}
            benchmarkResults={benchmarkResults}
            degradationPoints={degradationPoints}
            onTriggerMonteCarlo={handleTriggerMonteCarlo}
            monteCarloReport={monteCarloReport}
            isMonteCarloRunning={isMonteCarloRunning}
          />
        </section>

        {/* Row 4: Math background notes & scientific definitions card */}
        <section id="theory-section">
          <TheorySection />
        </section>

      </main>

      {/* 3. Footer */}
      <footer className="mt-12 border-t border-white/10 pt-6 pb-8 flex flex-col sm:flex-row justify-between items-center text-[10px] tracking-widest text-[#94a3b8]/30 uppercase font-mono">
        <div className="flex gap-6">
          <span>Simulation Mode: Resilient Synthetic</span>
          <span>Secure Link: ACTIVE</span>
        </div>
        <span>Designation: ATLAS-VII SECTOR C</span>
      </footer>

    </div>
  );
}
