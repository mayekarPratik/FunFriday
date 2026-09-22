import React, { useState } from 'react';
import { useWerewolfStore } from '../werewolfStore';
import { Sun, Vote, Skull, CheckCircle2 } from 'lucide-react';

export const PlayerDayVoting: React.FC = () => {
  const { gameState, getMyPlayer, submitVote } = useWerewolfStore();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(300000);

  const me = getMyPlayer();

  // If eliminated, render Spectator Mode
  if (me && !me.is_alive) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 z-50 select-none text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-600 mb-6 shadow-2xl shadow-red-950/80 animate-pulse">
          <Skull className="w-10 h-10" />
        </div>
        <div className="max-w-md space-y-4">
          <span className="px-3.5 py-1 rounded-full bg-red-950/50 border border-red-900/60 text-red-500 font-mono text-xs uppercase tracking-widest">
            Spectator Mode
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif text-gray-200 tracking-wide font-light leading-snug">
            You have been eliminated.
          </h1>
          <p className="text-sm sm:text-base text-gray-400 font-serif leading-relaxed">
            Do not speak. Watch the rest of the game unfold.
          </p>
        </div>
      </div>
    );
  }

  // Sync timer using absolute timestamp day_ends_at
  React.useEffect(() => {
    const endTimestamp = gameState?.day_ends_at || gameState?.timer_ends_at;
    if (!endTimestamp) return;

    const updateTimer = () => {
      const remaining = Math.max(0, endTimestamp - Date.now());
      setTimeLeftMs(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [gameState?.day_ends_at, gameState?.timer_ends_at]);

  if (!gameState || !me) {
    return (
      <div className="flex-1 w-full h-full bg-black text-[#94A3B8] flex items-center justify-center p-6 text-center font-mono text-sm">
        Syncing player identity...
      </div>
    );
  }

  const minutes = Math.floor(timeLeftMs / 60000);
  const seconds = Math.floor((timeLeftMs % 60000) / 1000);
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const currentVotes = gameState.votes || {};
  const myCurrentVote = currentVotes[me.socket_id];
  const hasVoted = Boolean(myCurrentVote);

  const alivePlayers = gameState.players.filter((p) => p.is_alive);
  const eligibleTargets = alivePlayers.filter((p) => p.socket_id !== me.socket_id);

  const handleVote = (targetSocketId: string) => {
    setSelectedTarget(targetSocketId);
    submitVote(targetSocketId);
  };

  return (
    <div className="flex-1 w-full h-full bg-[#090A0F] text-[#F8FAFC] flex flex-col justify-between p-3 sm:p-6 selection:bg-[#3B82F6]/30 overflow-hidden box-border">
      {/* Header Bar */}
      <header className="shrink-0 flex items-center justify-between pb-3 border-b border-[#1F2430]">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase">
          <Sun className="w-3.5 h-3.5" />
          <span>Day Trial • Voting</span>
        </div>

        <div className="font-mono text-xs text-[#94A3B8]">
          Timer: <span className="font-bold text-amber-400">{formattedTime}</span>
        </div>
      </header>

      {/* Main Voting Container */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center my-auto py-2 sm:py-4 overflow-hidden">
        <div className="w-full max-w-md flex flex-col items-center gap-4 max-h-full">
          <div className="text-center space-y-1 shrink-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Cast Your Vote</h2>
            <p className="text-xs text-[#94A3B8]">
              Select a player to accuse and put on trial for elimination.
            </p>
          </div>

          {/* Voted Confirmation Pill */}
          {hasVoted && (
            <div className="w-full shrink-0 p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-400 text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Your vote is locked on{' '}
                <strong className="text-white">
                  {gameState.players.find((p) => p.socket_id === myCurrentVote)?.name || 'Player'}
                </strong>
              </span>
            </div>
          )}

          {/* Player Target Selection Grid (scrolls internally only if options overflow) */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[48vh] overflow-y-auto pr-1">
            {eligibleTargets.map((player) => {
              const isSelected = (selectedTarget || myCurrentVote) === player.socket_id;
              return (
                <button
                  key={player.socket_id}
                  type="button"
                  onClick={() => handleVote(player.socket_id)}
                  className={`p-3 sm:p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer active:scale-98 ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                      : 'bg-[#12141C] border-[#1F2430] hover:border-amber-500/50 text-[#F8FAFC]'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm truncate">{player.name}</span>
                    <span className="text-[11px] text-[#94A3B8]">Tap to accuse</span>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? 'bg-amber-500 text-black'
                        : 'bg-[#191C28] text-[#94A3B8]'
                    }`}
                  >
                    <Vote className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer Instructions */}
      <footer className="shrink-0 text-center text-[11px] sm:text-xs text-[#64748B] py-2">
        Votes are tallied automatically when the discussion timer concludes.
      </footer>
    </div>
  );
};

export default PlayerDayVoting;
