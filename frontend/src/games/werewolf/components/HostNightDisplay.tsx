import React from 'react';
import { useWerewolfStore } from '../werewolfStore';
import { useCoreStore } from '../../../store/coreStore';
import { Moon, Sun, Skull, Flame, ChevronRight } from 'lucide-react';

export const NIGHT_ATMOSPHERE_TEXT: Record<string, string> = {
  wolf: 'The Werewolves are on the hunt...',
  doctor: 'The Doctor is making their rounds...',
  witch: 'The Witch is brewing potions...',
  sheriff: 'The Sheriff is loading a silver bullet...',
  seer: 'The Seer is peering into the future...',
  cupid: 'Cupid is aiming their arrows...',
  serial_killer: 'A shadowy figure stalks the alleys...',
  villager: 'The town is sleeping...',
  jester: 'The town is sleeping...',
  executioner: 'The town is sleeping...'
};

export const HostNightDisplay: React.FC = () => {
  const { gameState, hostAdvancePhase } = useWerewolfStore();
  const { activeRoleMode } = useCoreStore();

  if (!gameState) return null;

  const isHost = activeRoleMode === 'host';
  const phase = gameState.phase;

  // 1. Morning Recap Phase
  if (phase === 'morning_recap') {
    const recentDeaths = gameState.recent_deaths || [];
    const hasDeaths = recentDeaths.length > 0;

    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-between p-8 sm:p-12 z-50 select-none">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/40 border border-amber-900/60 text-amber-400 text-xs font-mono uppercase tracking-widest mt-4">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Dawn Recap</span>
        </div>

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
              <p className="text-xl sm:text-2xl md:text-3xl font-serif text-red-500 tracking-wide font-light">
                ...and the following victims were eliminated:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                {recentDeaths.map((name, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-red-950/50 border border-red-800/80 text-red-400 font-serif text-2xl sm:text-3xl font-bold shadow-2xl shadow-red-950/80"
                  >
                    <Skull className="w-6 h-6 text-red-500" />
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {isHost && (
          <div className="mb-6">
            <button
              onClick={hostAdvancePhase}
              className="group px-8 py-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 hover:border-amber-400 text-amber-400 hover:text-amber-300 text-base font-serif font-semibold tracking-wider transition-all duration-300 flex items-center gap-3 cursor-pointer shadow-xl shadow-amber-950/40 active:scale-95"
            >
              <span>Begin Day Phase</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. Dusk Recap Phase
  if (phase === 'dusk_recap') {
    const eliminated = gameState.last_day_eliminated;

    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-between p-8 sm:p-12 z-50 select-none">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/40 border border-purple-900/60 text-purple-400 text-xs font-mono uppercase tracking-widest mt-4">
          <Flame className="w-3.5 h-3.5 text-purple-400" />
          <span>Dusk Trial Verdict</span>
        </div>

        <div className="max-w-4xl text-center px-4 space-y-6 my-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-gray-200 tracking-wide font-light">
            The verdict has been sealed.
          </h1>

          {eliminated ? (
            <div className="space-y-4">
              <p className="text-xl sm:text-2xl font-serif text-purple-400 font-light">
                The village voted to execute:
              </p>
              <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-purple-950/50 border border-purple-800/80 text-purple-300 font-serif text-3xl sm:text-4xl font-bold shadow-2xl shadow-purple-950/80">
                <Skull className="w-8 h-8 text-purple-400" />
                {eliminated}
              </div>
            </div>
          ) : (
            <p className="text-2xl sm:text-3xl font-serif text-neutral-400 font-light">
              No one was executed today.
            </p>
          )}
        </div>

        {isHost && (
          <div className="mb-6">
            <button
              onClick={hostAdvancePhase}
              className="group px-8 py-4 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 hover:border-purple-400 text-purple-300 hover:text-purple-200 text-base font-serif font-semibold tracking-wider transition-all duration-300 flex items-center gap-3 cursor-pointer shadow-xl shadow-purple-950/40 active:scale-95"
            >
              <span>Begin Night Phase</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // 3. Active Night Phase (Host TV Screen)
  const activeRole = gameState.active_role || 'villager';
  const atmosphereText = NIGHT_ATMOSPHERE_TEXT[activeRole] || 'The village is sleeping...';

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-between p-8 sm:p-12 z-50 select-none">
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-neutral-400 text-xs font-mono uppercase tracking-widest mt-4">
        <Moon className="w-3.5 h-3.5 text-neutral-400" />
        <span>Night Phase • Eyes Closed</span>
      </div>

      <div className="max-w-4xl text-center px-4 space-y-6 my-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-gray-200 tracking-wide font-light">
          The Village is Sleeping...
        </h1>
        <p className="text-xl sm:text-2xl md:text-3xl font-serif text-neutral-500 italic tracking-wider font-light animate-pulse">
          {atmosphereText}
        </p>
      </div>

      <div className="flex items-center justify-between w-full max-w-4xl border-t border-neutral-900 pt-6 pb-2 text-neutral-600 text-xs font-mono tracking-widest uppercase">
        <span>Room: {gameState.room_code}</span>
        <span>Living: {gameState.players.filter((p) => p.is_alive).length}</span>
      </div>
    </div>
  );
};

export default HostNightDisplay;
