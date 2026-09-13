import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Moon, Sun, Skull, Flame, ChevronRight } from 'lucide-react';

export const NIGHT_ATMOSPHERE_TEXT: Record<string, string> = {
  wolf: 'The Werewolves are on the hunt...',
  doctor: 'The Doctor is making their rounds...',
  seer: 'The Seer is peering into the future...',
  witch: 'The Witch is brewing potions...',
  cupid: 'Cupid is aiming their arrows...',
  serial_killer: 'A shadowy figure stalks the alleys...',
  villager: 'The town is sleeping...',
  jester: 'The town is sleeping...',
  executioner: 'The town is sleeping...'
};

export const HostNightDisplay: React.FC = () => {
  const { gameState, hostAdvancePhase, activeRoleMode } = useGameStore();

  if (!gameState) return null;

  const isHost = activeRoleMode === 'host';
  const phase = gameState.phase;

  // 1. Morning Recap Phase
  if (phase === 'morning_recap') {
    const recentDeaths = gameState.recent_deaths || [];
    const hasDeaths = recentDeaths.length > 0;

    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-between p-8 sm:p-12 z-50 select-none">
        {/* Top Header Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/40 border border-amber-900/60 text-amber-400 text-xs font-mono uppercase tracking-widest mt-4">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Dawn Recap</span>
        </div>

        {/* Center Content */}
        <div className="max-w-4xl text-center px-4 space-y-6 my-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-gray-200 tracking-wide font-light">
            The sun rises...
          </h1>

          {!hasDeaths ? (
            <p className="text-2xl sm:text-3xl md:text-4xl font-serif text-blue-500 tracking-wide font-light animate-pulse">
              ...and the town survived the night peacefully.
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-xl sm:text-2xl md:text-3xl font-serif text-gray-300 font-light">
                ...but not for everyone. We found these bodies:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                {recentDeaths.map((victimName, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-red-950/40 border border-red-900/70 shadow-lg shadow-red-950/50"
                  >
                    <Skull className="w-6 h-6 text-red-600 animate-pulse shrink-0" />
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-red-600 tracking-wider">
                      {victimName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Host Control Button */}
        <div className="flex flex-col items-center gap-2 mb-4">
          {isHost && (
            <button
              onClick={hostAdvancePhase}
              className="px-8 py-3.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-sm tracking-wider uppercase flex items-center gap-2 shadow-xl shadow-blue-500/20 transition-all hover:scale-105 cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          <span className="text-neutral-600 text-xs font-mono tracking-widest uppercase">
            Host TV Display
          </span>
        </div>
      </div>
    );
  }

  // 2. Dusk Recap Phase
  if (phase === 'dusk_recap') {
    const executedName =
      gameState.recent_deaths && gameState.recent_deaths.length > 0
        ? gameState.recent_deaths[0]
        : gameState.last_day_eliminated;

    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-between p-8 sm:p-12 z-50 select-none">
        {/* Top Header Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/40 border border-purple-900/60 text-purple-400 text-xs font-mono uppercase tracking-widest mt-4">
          <Flame className="w-3.5 h-3.5 text-purple-400" />
          <span>Dusk Recap</span>
        </div>

        {/* Center Content */}
        <div className="max-w-4xl text-center px-4 space-y-6 my-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-gray-200 tracking-wide font-light">
            The town has spoken.
          </h1>

          {executedName ? (
            <div className="p-6 rounded-2xl bg-red-950/30 border border-red-900/50 inline-block shadow-2xl">
              <p className="text-2xl sm:text-3xl md:text-4xl font-serif text-gray-300 font-light">
                <span className="text-red-500 font-bold font-mono">{executedName}</span> was executed by the mob.
              </p>
            </div>
          ) : (
            <p className="text-xl sm:text-2xl md:text-3xl font-serif text-gray-400 font-light">
              The votes were split or skipped. No one was executed today.
            </p>
          )}
        </div>

        {/* Host Control Button */}
        <div className="flex flex-col items-center gap-2 mb-4">
          {isHost && (
            <button
              onClick={hostAdvancePhase}
              className="px-8 py-3.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-sm tracking-wider uppercase flex items-center gap-2 shadow-xl shadow-blue-500/20 transition-all hover:scale-105 cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          <span className="text-neutral-600 text-xs font-mono tracking-widest uppercase">
            Host TV Display
          </span>
        </div>
      </div>
    );
  }

  // 3. Night Phase Atmosphere
  const activeRole = gameState.active_role;
  const displayText =
    activeRole && NIGHT_ATMOSPHERE_TEXT[activeRole]
      ? NIGHT_ATMOSPHERE_TEXT[activeRole]
      : 'Dawn is approaching...';

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 z-50 select-none">
      {/* Subtle top indicator */}
      <div className="absolute top-8 flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900/60 border border-neutral-800 text-neutral-500 text-xs font-mono uppercase tracking-widest">
        <Moon className="w-3.5 h-3.5 text-indigo-400" />
        <span>Night Phase</span>
      </div>

      {/* Atmospheric text display */}
      <div className="max-w-4xl text-center px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-gray-300 animate-pulse tracking-wide leading-relaxed font-light">
          {displayText}
        </h1>
      </div>

      {/* Subtle bottom info */}
      <div className="absolute bottom-8 text-neutral-600 text-xs font-mono tracking-widest uppercase">
        Host TV Display
      </div>
    </div>
  );
};


