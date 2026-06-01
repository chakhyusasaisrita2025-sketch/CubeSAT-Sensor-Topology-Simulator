/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { SensorNode, CommunicationEdge, MetricsHistoryEntry, TopologyType, UserProfile } from './types';
import {
  generateNodes,
  generateEdges,
  computeSelfHealing,
  calculateCoveragePersistence,
  CORE_NODE_ID,
} from './utils/simulationEngine';
import CubeSatVisualizer from './components/CubeSatVisualizer';
import CoverageHeatmap from './components/CoverageHeatmap';
import MetricsDashboard from './components/MetricsDashboard';
import TheorySection from './components/TheorySection';
import OnboardingTour from './components/OnboardingTour';
import UserProfilePanel from './components/UserProfilePanel';
import { getActiveUser, addXPAndCheckAchievements, ACHIEVEMENT_DEFS } from './utils/achievementEngine';
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
  Sparkles,
  Trophy,
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

  // User profile & Onboarding states
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(() => getActiveUser());
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [tourStepIndex, setTourStepIndex] = useState<number>(0);
  const [unlockedToast, setUnlockedToast] = useState<{ title: string; badge: string; xp: number } | null>(null);
  const [visitedTopologies, setVisitedTopologies] = useState<string[]>(['grid']);

  // Trigger XP and achievements
  const triggerXPEarned = (xp: number, achievementId?: string) => {
    if (!activeProfile) return;
    const { updatedProfile, newlyUnlocked } = addXPAndCheckAchievements(
      activeProfile,
      xp,
      achievementId
    );
    setActiveProfile(updatedProfile);
    if (newlyUnlocked.length > 0) {
      const ach = newlyUnlocked[0];
      setUnlockedToast({
        title: ach.title,
        badge: ach.badgeSymbol,
        xp: ach.xpReward,
      });
      // automatically remove after 5 seconds
      setTimeout(() => {
        setUnlockedToast(null);
      }, 5000);
    }
  };

  // Listen for topology explorations
  useEffect(() => {
    if (!activeProfile) return;
    setVisitedTopologies((prev) => {
      if (prev.includes(topologyType)) return prev;
      const next = [...prev, topologyType];
      if (next.length === 4) {
        triggerXPEarned(0, 'topology_weaver');
      }
      return next;
    });
  }, [topologyType, activeProfile]);

  // Listen for sliders at outer limits
  useEffect(() => {
    if (!activeProfile) return;
    if (commRange >= 44) {
      triggerXPEarned(0, 'limits_max_comm');
    }
  }, [commRange, activeProfile]);

  useEffect(() => {
    if (!activeProfile) return;
    if (sensingRange >= 16) {
      triggerXPEarned(0, 'limits_max_sens');
    }
  }, [sensingRange, activeProfile]);

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
    };

    setNodes(rawNodes);
    setEdges(rawEdges);
    setHistory([initialHistoryEntry]);
    setSelectedNode(null);
    setCurrentScenario('Nominal Orbit');
    setIsStormActive(false);
  };

  // Run initial build on mount or topology change
  useEffect(() => {
    initSimulation();
  }, [topologyType, commRange, sensingRange]);

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

    // Calculate conventional connectivity
    // (conventional routing breaks instantly if a node is severed from the center)
    const normalActiveCount = currentNodes.filter(n => n.id !== CORE_NODE_ID && n.state !== 'failed').length;
    
    // Quick conventional connectedness mock: standard links directly connected
    const conventionalConnectivity = out.reconnectionRate * 0.72; // drops faster without dynamic routing bypasses

    const failedCount = currentNodes.filter(n => n.state === 'failed').length;

    // Trigger Resilience Expert achievement if conditions meta
    if (activeProfile && failedCount >= 6 && persistenceSelfHealing >= 80) {
      triggerXPEarned(0, 'resilience_expert');
    }

    setHistory((prev) => {
      const nextStep = prev.length;
      return [
        ...prev,
        {
          step: nextStep,
          coveragePersistenceSelfHealing: persistenceSelfHealing,
          coveragePersistenceConventional: persistenceConventional,
          connectivityRatioSelfHealing: out.reconnectionRate,
          connectivityRatioConventional: Math.max(0, Math.min(100, failedCount > 0 ? conventionalConnectivity : 100)),
          failuresCount: failedCount,
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
    setCurrentScenario('Radiation Storm (Solar Flare)');
    setIsStormActive(true);

    if (activeProfile) {
      triggerXPEarned(0, 'scen_radiation_storm');
    }

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

        const updated = prevNodes.map((n) =>
          n.id === selected.id ? { ...n, state: 'failed' as const } : n
        );
        
        step++;
        recordHistoryStep(updated);
        return updated;
      });
    }, 450);
  };

  // Scenario 2: Micro-Meteorite Debris Impact (cuts diagonal trajectory through surface)
  const triggerDebrisImpact = () => {
    initSimulation();
    setCurrentScenario('Orbital Debris Penetration');
    setIsStormActive(true);

    if (activeProfile) {
      triggerXPEarned(0, 'scen_debris_impact');
    }

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
    }, 550);
  };

  // Scenario 3: Thermal Cycling Overheat (degrades outer face nodes gradually)
  const triggerThermalOverheat = () => {
    initSimulation();
    setCurrentScenario('Critical Thermal Degradation');
    setIsStormActive(true);

    if (activeProfile) {
      triggerXPEarned(0, 'scen_thermal_degrade');
    }

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
    }, 500);
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
          <div className="flex flex-wrap md:flex-nowrap gap-6 md:gap-10 items-center justify-between text-right">
            <div className="flex gap-8 text-right">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono">Current Orbit State</p>
                <p className="text-sm font-mono leading-none text-amber-500 font-semibold tracking-tight uppercase select-all">{currentScenario}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono">System Integrity</p>
                <p className="text-sm font-mono leading-none text-emerald-400 font-semibold">{(100 - failurePercentage).toFixed(2)}%</p>
              </div>
            </div>

            <div className="flex items-center pl-4 border-l border-white/10 gap-3">
              <UserProfilePanel
                activeProfile={activeProfile}
                onProfileChange={(prof) => setActiveProfile(prof)}
                onOpenTour={() => {
                  setTourStepIndex(0);
                  setIsTourOpen(true);
                }}
              />

              <button
                onClick={initSimulation}
                className="h-10 px-4 border border-[#d4af37]/40 rounded flex items-center justify-center text-[10px] uppercase tracking-wider font-semibold hover:bg-[#d4af37]/20 transition-colors text-[#d4af37] cursor-pointer"
                title="Reset Simulation"
                id="top-reset-button"
              >
                <RotateCcw className="w-3 h-3 mr-1.5" />
                <span>Full Restart</span>
              </button>

              <button
                onClick={() => {
                  setTourStepIndex(0);
                  setIsTourOpen(true);
                }}
                className="h-10 w-10 border border-white/10 rounded flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                title="Launch Guided Onboarding"
                id="top-tour-button"
              >
                <HelpCircle className="w-4 h-4 text-[#d4af37]" />
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
            connectivityConventional={reconnectionRate * 0.76} // drops faster in static comparative
            recoveryEfficiency={recoveryEfficiency}
            faultToleranceIndex={faultToleranceIndex}
            history={history}
            totalNodesCount={nodes.length}
            activeNodesCount={activeSensingNodes}
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

      {/* Onboarding tour walk-through */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onComplete={() => {
          setIsTourOpen(false);
          // Unlock achievement
          if (activeProfile) {
            triggerXPEarned(0, 'onboarding_clear');
          }
        }}
        currentStepIndex={tourStepIndex}
        setCurrentStepIndex={setTourStepIndex}
      />

      {/* Dynamic Floating Achievement Toast Banner */}
      {unlockedToast && (
        <div className="fixed top-24 right-6 bg-black/95 border-2 border-[#d4af37] text-white rounded-lg p-4 shadow-2xl z-50 flex items-center gap-3 animate-bounce shadow-amber-500/10 max-w-sm" style={{ pointerEvents: 'auto' }}>
          <div className="w-10 h-10 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/45 flex items-center justify-center text-xl">
            {unlockedToast.badge}
          </div>
          <div>
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#d4af37] block font-bold">🎖️ MEDAL UNLOCKED 🎖️</span>
            <h4 className="text-xs font-bold font-mono text-white leading-tight">{unlockedToast.title}</h4>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold block mt-0.5 animate-pulse">+{unlockedToast.xp} XP LEVEL AWARD</span>
          </div>
        </div>
      )}

    </div>
  );
}
