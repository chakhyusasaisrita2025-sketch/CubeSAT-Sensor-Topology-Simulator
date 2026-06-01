import React from 'react';
import { HelpCircle, ChevronRight, ChevronLeft, Check, Sparkles, X } from 'lucide-react';

export interface OnboardingStep {
  targetId: string;
  title: string;
  description: string;
  actionRequired?: string; // e.g. "Switch layout", "Run storm", etc
}

const TOUR_STEPS: OnboardingStep[] = [
  {
    targetId: 'aerospace-wireframe-card',
    title: '3D CubeSat Node-Graph Wireframe',
    description: 'This is a live 3D coordinate model of your 3U aerospace cuboid. Drag with your mouse/touch to orbit the spacecraft. Click on any individual sensor vertex to probe active telemetry coordinate streams in real time.',
  },
  {
    targetId: 'telemetry-controllers',
    title: 'Simulation Configurations',
    description: 'Use the antenna mesh buttons to choose a spatial geometry (Grid, Honeycomb, Fractal, or Random). Adjust sliders to dial in P2P Comm Ranges (maximum links), Base Sensor Ranges, or critical Self-Healing Gain Peaks (power multiplication factor).',
  },
  {
    targetId: 'btn-scen-storm',
    title: 'Cascade Stress Controls',
    description: 'Inject direct environmental anomalies! Trigger a cascading Solar Flare storm, a high-velocity particle Debris Strike, or gradual thermal degradation to see how well the cooperative nodes survive compared to static structures.',
  },
  {
    targetId: 'coverage-heatmaps',
    title: 'Side-by-Side Skin Heatmap Projection',
    description: 'This side-by-side display maps the sensory skin of your unfurled CubeSat carcass. Look closely as failed nodes create deep "blind spots" (dark zones) on the Conventional side, while the Self-Healing side recruits neighbor nodes to maintain seamless coverage.',
  },
  {
    targetId: 'metrics-dashboard',
    title: 'Real-time Degradation Curves',
    description: 'Evaluate physical network survivability. This grid measures coverage persistence ratios, dynamic routing hops back to the main CPU core, and traces live signal decay graphs as damage cascading accumulates in orbit.',
  },
  {
    targetId: 'theory-section',
    title: 'Mathematical & Biological Foundations',
    description: 'Explore the full math equations (such as Gaussian signal curves) and somatic neural plasticity paradigms that ground this high-fidelity mesh software.',
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  currentStepIndex: number;
  setCurrentStepIndex: (idx: number) => void;
}

export default function OnboardingTour({
  isOpen,
  onClose,
  onComplete,
  currentStepIndex,
  setCurrentStepIndex,
}: OnboardingTourProps) {
  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
      scrollToElement(TOUR_STEPS[currentStepIndex + 1].targetId);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      scrollToElement(TOUR_STEPS[currentStepIndex - 1].targetId);
    }
  };

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Temporary flash border to highlight the component
      el.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-4', 'ring-offset-black', 'transition-all', 'duration-1000');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-4', 'ring-offset-black');
      }, 2500);
    }
  };

  React.useEffect(() => {
    scrollToElement(currentStep.targetId);
  }, [currentStepIndex]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col items-center justify-end md:justify-center p-4">
      {/* Target Highlight Box Pointer helper */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/90 border border-emerald-500/30 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-mono text-emerald-400 select-none animate-pulse">
        <Sparkles className="w-3.5 h-3.5" />
        <span>FLIGHT OFFICER GUIDED MODE ACTIVE [STEP {currentStepIndex + 1} OF {TOUR_STEPS.length}]</span>
      </div>

      <div className="w-full max-w-lg bg-[#070708]/95 border-2 border-[#d4af37]/40 rounded-xl shadow-2xl p-6 relative overflow-hidden flex flex-col space-y-4">
        {/* Background circuit matrix styling */}
        <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-[#d4af37]/10 rounded border border-[#d4af37]/30 text-[#d4af37]">
              <HelpCircle className="w-4 h-4 animate-spin-[20s]" />
            </span>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#d4af37]/70 block">Orbital Deck Tour</span>
              <h3 className="text-base font-serif tracking-tight text-white" style={{ fontFamily: 'Georgia, serif' }}>
                {currentStep.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded border border-white/10 hover:bg-white/5 text-white/50 hover:text-white transition-all cursor-pointer"
            title="Terminate Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Instructional content */}
        <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4 relative z-10">
          <p className="text-xs text-white/70 leading-relaxed font-mono">
            {currentStep.description}
          </p>
        </div>

        {/* Visual Progress Steps Map Indicator dot loops */}
        <div className="flex items-center justify-between pt-2 relative z-10">
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`w-2.5 h-1.5 rounded transition-all duration-300 ${
                  idx === currentStepIndex
                    ? 'w-6 bg-[#d4af37]'
                    : idx < currentStepIndex
                    ? 'bg-emerald-500'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="h-8 px-3 border border-white/10 hover:border-white/20 rounded flex items-center justify-center text-[10px] uppercase font-mono tracking-wider font-semibold hover:bg-white/5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="h-8 px-4 bg-[#d4af37] text-black font-bold rounded flex items-center justify-center text-[10px] uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
            >
              {isLastStep ? (
                <>
                  Complete Tour
                  <Check className="w-3.5 h-3.5 ml-1" />
                </>
              ) : (
                <>
                  Next Station
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
