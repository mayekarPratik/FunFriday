import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Moon, Skull, Eye, HeartPulse, ChevronRight, Users, ShieldAlert } from 'lucide-react';

export const HostNightDisplay: React.FC = () => {
  const { gameState, advanceNightPriority } = useGameStore();

  if (!gameState) return null;

  const currentPriority = gameState.active_role_priority;

  const priorityLabels: Record<number, { title: string; desc: string; icon: any; color: string }> = {
    1: {
      title: 'Werewolves Wake Up',
      desc: 'The wolves are selecting a victim in secret.',
      icon: Skull,
      color: 'text-red-500'
    },
    2: {
      title: 'Doctor Wakes Up',
      desc: 'The doctor is deciding whom to protect tonight.',
      icon: HeartPulse,
      color: 'text-emerald-400'
    },
    3: {
      title: 'Seer Wakes Up',
      desc: 'The seer is inspecting a suspect alignment.',
      icon: Eye,
      color: 'text-blue-400'
    },
    0: {
      title: 'The Village Sleeps',
      desc: 'Night phase completing...',
      icon: Moon,
      color: 'text-neutral-400'
    }
  };

  const currentStage = priorityLabels[currentPriority] || priorityLabels[0];
  const StageIcon = currentStage.icon;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center gap-8 py-8">
      {/* Night Atmosphere Card */}
      <div className="wope-card p-10 sm:p-14 w-full flex flex-col items-center relative overflow-hidden shadow-2xl">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-950/20 blur-3xl rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-400 text-xs font-mono uppercase mb-6">
          <Moon className="w-3.5 h-3.5 text-blue-400" /> Night Phase • Stage {currentPriority} / 3
        </div>

        {/* Large Stage Icon */}
        <div className="w-24 h-24 rounded-3xl bg-[#191C28] border border-[#1F2430] flex items-center justify-center mb-6 shadow-2xl">
          <StageIcon className={`w-12 h-12 ${currentStage.color} animate-pulse`} />
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#F8FAFC] mb-2">
          {currentStage.title}
        </h1>
        <p className="text-sm sm:text-base text-[#94A3B8] max-w-lg mb-8">
          {currentStage.desc} Players are looking down at their private controllers.
        </p>

        {/* Host Control Bar to cycle roles */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-[#1F2430] w-full">
          <button
            onClick={() => advanceNightPriority(1)}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition cursor-pointer border ${
              currentPriority === 1
                ? 'bg-red-950/50 border-red-500 text-red-400 shadow-md'
                : 'bg-[#090A0F] border-[#1F2430] text-[#94A3B8] hover:text-white'
            }`}
          >
            1. Werewolves
          </button>

          <button
            onClick={() => advanceNightPriority(2)}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition cursor-pointer border ${
              currentPriority === 2
                ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400 shadow-md'
                : 'bg-[#090A0F] border-[#1F2430] text-[#94A3B8] hover:text-white'
            }`}
          >
            2. Doctor
          </button>

          <button
            onClick={() => advanceNightPriority(3)}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition cursor-pointer border ${
              currentPriority === 3
                ? 'bg-blue-950/50 border-blue-500 text-blue-400 shadow-md'
                : 'bg-[#090A0F] border-[#1F2430] text-[#94A3B8] hover:text-white'
            }`}
          >
            3. Seer
          </button>

          <button
            onClick={() => advanceNightPriority()}
            className="wope-btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer ml-2 text-neutral-300"
          >
            <span>Next Stage</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => useGameStore.getState().resolveNightToDay()}
            className="wope-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#3B82F6]/25"
          >
            <span>Awaken Town (Start Day)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Village status summary */}
      <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#12141C] border border-[#1F2430] text-xs font-mono text-[#94A3B8]">
        <span className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#3B82F6]" />
          {gameState.players.length} Total Players Alive
        </span>
        <span className="flex items-center gap-1.5 text-neutral-400">
          <ShieldAlert className="w-3.5 h-3.5" /> Host Screen (Public / Safe)
        </span>
      </div>
    </div>
  );
};
