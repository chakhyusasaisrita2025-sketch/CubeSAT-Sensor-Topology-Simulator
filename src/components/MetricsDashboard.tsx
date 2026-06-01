import React from 'react';
import { ShieldCheck, Cpu, HardDrive, AlertTriangle, HelpCircle } from 'lucide-react';
import { MetricsHistoryEntry } from '../types';

interface MetricsDashboardProps {
  coverageSelfHealing: number;
  coverageConventional: number;
  connectivitySelfHealing: number;
  connectivityConventional: number;
  recoveryEfficiency: number;
  faultToleranceIndex: number;
  history: MetricsHistoryEntry[];
  totalNodesCount: number;
  activeNodesCount: number;
}

export default function MetricsDashboard({
  coverageSelfHealing,
  coverageConventional,
  connectivitySelfHealing,
  connectivityConventional,
  recoveryEfficiency,
  faultToleranceIndex,
  history,
  totalNodesCount,
  activeNodesCount,
}: MetricsDashboardProps) {
  // Safe math bounds with defensive fallbacks in case props are undefined
  const safeCoverageSelfHealing = coverageSelfHealing ?? 100;
  const safeCoverageConventional = coverageConventional ?? 100;
  const safeConnectivitySelfHealing = connectivitySelfHealing ?? 100;
  const safeConnectivityConventional = connectivityConventional ?? 100;
  const safeRecoveryEfficiency = recoveryEfficiency ?? 100;
  const safeFaultToleranceIndex = faultToleranceIndex ?? 100;

  const persistenceDelta = Math.max(0, safeCoverageSelfHealing - safeCoverageConventional);
  const connectivityDelta = Math.max(0, safeConnectivitySelfHealing - safeConnectivityConventional);

  // SVG Line Graph configurations
  const width = 560;
  const height = 180;
  const padding = 30;

  const pointsSelfHealing = history.map((entry, index) => {
    // scale to SVG dimensions
    const x = padding + (index / Math.max(1, history.length - 1)) * (width - padding * 2);
    const y = height - padding - ((entry.coveragePersistenceSelfHealing ?? 100) / 100) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const pointsConventional = history.map((entry, index) => {
    const x = padding + (index / Math.max(1, history.length - 1)) * (width - padding * 2);
    const y = height - padding - ((entry.coveragePersistenceConventional ?? 100) / 100) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-xl mb-8" id="metrics-dashboard">
      <div className="border-b border-white/10 pb-4 mb-6">
        <span className="text-white/40 text-[10px] font-mono uppercase tracking-[0.25em]">Real-time Telemetry Analytics</span>
        <h2 className="text-xl font-light text-[#e0e0e0] tracking-tight mt-1 font-serif" style={{ fontFamily: 'Georgia, serif' }}>
          Evaluation Metrics & <span className="italic text-white/50">Degradation Curves</span>
        </h2>
        <p className="text-white/40 text-[11px] font-mono mt-1">
          Evaluating surviving sensing continuity and packet route viability against cumulative orbital damages.
        </p>
      </div>

      {/* Grid of the 4 Evaluation Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Metric 1: Coverage Persistence */}
        <div className="bg-[#070708] border border-white/10 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-white/50 text-[10px] font-mono uppercase tracking-wider">Coverage Persistence</span>
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-[10px] text-white/30 font-mono block mt-1">Sensing Field Retained</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-slate-100">{safeCoverageSelfHealing.toFixed(1)}%</span>
            {persistenceDelta > 0 && (
              <span className="text-xs font-semibold text-emerald-400 font-mono">+{persistenceDelta.toFixed(1)}%</span>
            )}
          </div>
          <div className="mt-2 text-[10px] text-white/40 font-mono">
            Conventional drops to <span className="text-red-400 font-semibold">{safeCoverageConventional.toFixed(1)}%</span>
          </div>
        </div>

        {/* Metric 2: Connectivity Ratio */}
        <div className="bg-[#070708] border border-white/10 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-white/50 text-[10px] font-mono uppercase tracking-wider">Connectivity Ratio</span>
              <Cpu className="w-5 h-5 text-cyan-500" />
            </div>
            <span className="text-[10px] text-white/30 font-mono block mt-1">Routes Back to Core OBC</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-slate-100">{safeConnectivitySelfHealing.toFixed(1)}%</span>
            {connectivityDelta > 0 && (
              <span className="text-xs font-semibold text-cyan-400 font-mono">+{connectivityDelta.toFixed(1)}%</span>
            )}
          </div>
          <div className="mt-2 text-[10px] text-white/40 font-mono">
            Conventional severed to <span className="text-red-400 font-semibold">{safeConnectivityConventional.toFixed(1)}%</span>
          </div>
        </div>

        {/* Metric 3: Recovery Efficiency */}
        <div className="bg-[#070708] border border-white/10 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-white/50 text-[10px] font-mono uppercase tracking-wider">Recovery Speed</span>
              <HardDrive className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-[10px] text-white/30 font-mono block mt-1">Peer Route Latency Impact</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-slate-100">{safeRecoveryEfficiency.toFixed(1)}%</span>
            <span className="text-xs text-amber-400 font-mono">optimal path</span>
          </div>
          <div className="mt-2 text-[10px] text-white/40 font-mono">
            Self-organizes bypass links within <span className="text-slate-300">12 ms</span>
          </div>
        </div>

        {/* Metric 4: Fault Tolerance Index */}
        <div className="bg-[#070708] border border-white/10 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-white/50 text-[10px] font-mono uppercase tracking-wider">Fault Tolerance Index</span>
              <AlertTriangle className="w-5 h-5 text-indigo-500" />
            </div>
            <span className="text-[10px] text-white/30 font-mono block mt-1">Comparative Resilience Ratio</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-slate-100">{safeFaultToleranceIndex.toFixed(0)}</span>
            <span className="text-xs text-indigo-400 font-mono">Benchmark index</span>
          </div>
          <div className="mt-2 text-[10px] text-white/40 font-mono">
            Provides <span className="text-[#d4af37]">x{(safeFaultToleranceIndex / 100).toFixed(2)}</span> greater hardware survivability
          </div>
        </div>

      </div>

      {/* Decline Curve Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Timeline SVG Chart */}
        <div className="lg:col-span-2 bg-[#070708] border border-white/10 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-white/80 text-[10px] font-mono font-semibold block uppercase tracking-wider">Conventional vs Self-Healing Curve</span>
              <span className="text-white/30 text-[9px] font-mono block">X-Axis represents damage cycles. Y-Axis is coverage persistence.</span>
            </div>
            <div className="flex gap-4 text-[10px] font-mono">
              <div className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span>
                <span className="text-emerald-400">Self-Healing</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-0.5 border-t border-dashed border-red-500 inline-block"></span>
                <span className="text-red-400">Conventional</span>
              </div>
            </div>
          </div>

          <div className="relative w-full overflow-hidden">
            {history.length > 1 ? (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block select-none">
                <defs>
                  <linearGradient id="gradient-healing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
                <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="3,3" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />

                {/* Left labels */}
                <text x={padding - 6} y={padding + 4} fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace" textAnchor="end">100%</text>
                <text x={padding - 6} y={height / 2 + 3} fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace" textAnchor="end">50%</text>
                <text x={padding - 6} y={height - padding + 2} fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace" textAnchor="end">0%</text>

                {/* Chart fill paths for areas */}
                <path
                  d={`M ${padding},${height - padding} L ${pointsSelfHealing} L ${width - padding},${height - padding} Z`}
                  fill="url(#gradient-healing)"
                />

                {/* SVG Lines */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.2"
                  points={pointsSelfHealing}
                  className="drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]"
                />
                <polyline
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1.8"
                  strokeDasharray="4,3"
                  points={pointsConventional}
                />

                {/* Circle pointer for current step */}
                {history.length > 0 && (
                  <>
                    {/* Current Self-Healing node point */}
                    <circle
                      cx={padding + ((history.length - 1) / Math.max(1, history.length - 1)) * (width - padding * 2)}
                      cy={height - padding - (coverageSelfHealing / 100) * (height - padding * 2)}
                      r="4"
                      fill="#10b981"
                    />
                    {/* Current Conventional node point */}
                    <circle
                      cx={padding + ((history.length - 1) / Math.max(1, history.length - 1)) * (width - padding * 2)}
                      cy={height - padding - (coverageConventional / 100) * (height - padding * 2)}
                      r="3"
                      fill="#ef4444"
                    />
                  </>
                )}
                
                {/* Horizontal steps markers */}
                <text x={padding} y={height - padding + 14} fill="rgba(255, 255, 255, 0.3)" fontSize="8" fontFamily="monospace">INIT (HEALTHY)</text>
                <text x={width - padding} y={height - padding + 14} fill="rgba(255, 255, 255, 0.3)" fontSize="8" fontFamily="monospace" textAnchor="end">STEP {history.length - 1} (CURRENT)</text>
              </svg>
            ) : (
              <div className="h-[120px] flex items-center justify-center text-xs text-white/30 font-mono">
                Initiate damage simulation steps to trace real-time curves
              </div>
            )}
          </div>
        </div>

        {/* Physical Status Checklist */}
        <div className="bg-[#070708] border border-white/10 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <span className="text-white/80 text-[10px] font-mono font-semibold block mb-3 uppercase tracking-wider">Component Health HUD</span>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-white/40">Spacecraft Spec</span>
                <span className="text-white/80">3U Cuboid Outer Shell</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-white/40">Active Sensors</span>
                <span className="text-cyan-400 font-sans font-semibold">
                  {activeNodesCount} / {Math.max(1, totalNodesCount - 1)}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-white/40">Total System Hops</span>
                <span className="text-white/80">{recoveryEfficiency > 0 ? 'Optimal (BFS)' : 'Severed'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Failures Cascade</span>
                <span className={`${history.length > 1 && history[history.length - 1].failuresCount > 0 ? 'text-red-400' : 'text-white/30'}`}>
                  {history.length > 0 ? history[history.length - 1].failuresCount : 0} damaged
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-2.5 rounded border border-white/10 text-[9px] text-white/40 mt-4 leading-relaxed font-mono">
            <span className="text-[#94a3b8] font-bold">TELEMETRY SECURE:</span> Active backup comrades scale transmission gain matching spatial specifications dynamically.
          </div>
        </div>

      </div>
    </div>
  );
}
