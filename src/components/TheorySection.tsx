import { CheckSquare, GitBranch, Zap, Layers, RefreshCw } from 'lucide-react';

export default function TheorySection() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-xl mb-8" id="theory-section">
      <div className="border-b border-white/10 pb-4 mb-6">
        <span className="text-white/40 text-[10px] font-mono uppercase tracking-[0.25em]">Aerospace Framework Documentation</span>
        <h2 className="text-xl font-light text-[#e0e0e0] tracking-tight mt-1 font-serif" style={{ fontFamily: 'Georgia, serif' }}>
          Self-Healing Orbital <span className="italic text-white/50">Mesh Theory</span>
        </h2>
        <p className="text-white/40 text-[11px] font-mono mt-1">
          A distributed resilient architecture inspired by biological neural plasticity and coordinate geometry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Mathematical Concepts */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <GitBranch className="text-[#94a3b8] w-4 h-4" />
            <span className="text-xs uppercase font-mono text-[#e0e0e0] font-semibold tracking-wider">Coordinate Mathematics</span>
          </div>
          <div className="space-y-3">
            <div className="bg-[#070708] p-3 rounded border border-white/10">
              <span className="text-white/80 text-[10px] font-mono block font-semibold mb-1 uppercase tracking-wider">Topology Model</span>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Hardware sensors are mapped as 3D coordinate vertices $V$ connected by communication edges $E$. Dynamic mesh constraints govern peer validation.
              </p>
            </div>
            <div className="bg-[#070708] p-3 rounded border border-white/10">
              <span className="text-white/80 text-[10px] font-mono block font-semibold mb-1 uppercase tracking-wider">Gain Recalculation</span>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Upon node degradation, system coverage states recalculate adjacent sensitivity envelopes using Gaussian wave distribution indices:
                <br />
                <span className="text-[#d4af37] font-mono text-[9px] block mt-1.5 font-bold">
                  S(p) = Σ exp(-d(n, p)² / 2r²)
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Biological Inspiration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="text-[#d4af37] w-4 h-4" />
            <span className="text-xs uppercase font-mono text-[#e0e0e0] font-semibold tracking-wider">Biological Synapse System</span>
          </div>
          <div className="space-y-3">
            <div className="bg-[#070708] p-3 rounded border border-white/10">
              <span className="text-white/80 text-[10px] font-mono block font-semibold mb-1 uppercase tracking-wider">Neural Plasticity</span>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Inspired by somatic nervous systems where active synapses extend reach after cerebral failures, undamaged adjacent CubeSats scale power inputs to absorb dead cells.
              </p>
            </div>
            <div className="bg-[#070708] p-3 rounded border border-white/10">
              <span className="text-white/80 text-[10px] font-mono block font-semibold mb-1 uppercase tracking-wider">Hive Decentralization</span>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Operates without single centralized nodes. Peer-to-peer heartbeat checks handle localized recovery loops autonomously.
              </p>
            </div>
          </div>
        </div>

        {/* Distributed Optimization & Scalability */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="text-[#94a3b8] w-4 h-4" />
            <span className="text-xs uppercase font-mono text-[#e0e0e0] font-semibold tracking-wider">Distributed Operations</span>
          </div>
          <div className="space-y-3">
            <div className="bg-[#070708] p-3 rounded border border-white/10">
              <span className="text-white/80 text-[10px] font-mono block font-semibold mb-1 uppercase tracking-wider">Workload Redirection</span>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Active nodes accept increased compute and electrical loads recursively, maintaining critical path routing to preserve core telemetry.
              </p>
            </div>
            <div className="bg-[#070708] p-3 rounded border border-white/10">
              <span className="text-white/80 text-[10px] font-mono block font-semibold mb-1 uppercase tracking-wider">Radiative Integrity</span>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Implements structural self-healing in software, significantly boosting spacecraft lifetime cycles during heavy galactic cosmic rays (GCRs).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Summary of Benefits */}
      <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#070708] border border-white/10 rounded-lg p-3 flex gap-3 items-center">
          <div className="w-7 h-7 rounded-sm bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] font-mono text-xs border border-[#d4af37]/20">
            H1
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-wider font-semibold text-white/80">Sensing Continuity</h4>
            <span className="text-white/30 text-[9px] font-mono block">No single failure points</span>
          </div>
        </div>
        <div className="bg-[#070708] border border-white/10 rounded-lg p-3 flex gap-3 items-center">
          <div className="w-7 h-7 rounded-sm bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-mono text-xs border border-emerald-500/20">
            H2
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-wider font-semibold text-white/80">Dynamic Rerouting</h4>
            <span className="text-white/30 text-[9px] font-mono block">Autonomous BFS pathing</span>
          </div>
        </div>
        <div className="bg-[#070708] border border-white/10 rounded-lg p-3 flex gap-3 items-center">
          <div className="w-7 h-7 rounded-sm bg-cyan-400/10 flex items-center justify-center text-cyan-400 font-mono text-xs border border-cyan-400/20">
            H3
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-wider font-semibold text-white/80">Plastic Gain Boost</h4>
            <span className="text-white/30 text-[9px] font-mono block">No sensor blind spots</span>
          </div>
        </div>
        <div className="bg-[#070708] border border-white/10 rounded-lg p-3 flex gap-3 items-center">
          <div className="w-7 h-7 rounded-sm bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-mono text-xs border border-indigo-500/20">
            H4
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-wider font-semibold text-white/80">Surviving Metrics</h4>
            <span className="text-white/30 text-[9px] font-mono block">Real-time status analysis</span>
          </div>
        </div>
      </div>
    </div>
  );
}
