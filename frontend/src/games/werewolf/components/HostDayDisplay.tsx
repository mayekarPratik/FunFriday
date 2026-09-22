import React, { useState, useEffect } from 'react';
import { useWerewolfStore } from '../werewolfStore';
import { useCoreStore } from '../../../store/coreStore';
import { Sun, Skull, ShieldCheck, Clock, Users, Vote, CheckCircle2 } from 'lucide-react';

export const HostDayDisplay: React.FC = () => {
  const { gameState, tallyDayVotes } = useWerewolfStore();
  const { activeRoleMode } = useCoreStore();
  const [timeLeftMs, setTimeLeftMs] = useState<number>(300000);

  // Sync countdown timer with absolute timestamp day_ends_at
  useEffect(() => {
    const endTimestamp = gameState?.day_ends_at || gameState?.timer_ends_at;
    if (!endTimestamp) return;

    const updateTimer = () => {
      const remaining = Math.max(0, endTimestamp - Date.now());
      setTimeLeftMs(remaining);

      if (remaining === 0) {
        tallyDayVotes();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [gameState?.day_ends_at, gameState?.timer_ends_at, tallyDayVotes]);

  if (!gameState) return null;

  const isHost = activeRoleMode === 'host';
  const minutes = Math.floor(timeLeftMs / 60000);
  const seconds = Math.floor((timeLeftMs % 60000) / 1000);
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalDuration = (gameState.settings?.discussion_time_seconds || 300) * 1000;
  const timerPercentage = Math.max(0, Math.min(100, (timeLeftMs / totalDuration) * 100));

  const livingPlayers = gameState.players.filter((p) => p.is_alive);
  const deadPlayers = gameState.players.filter((p) => !p.is_alive);
  const totalVotesCast = Object.keys(gameState.votes || {}).length;

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto box-border py-4 px-2 sm:px-4">
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center text-center gap-6 sm:gap-8">
        {/* Top Casualty & Day Header */}
      <div className="wope-card p-8 sm:p-10 w-full flex flex-col items-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase mb-4">
          <Sun className="w-3.5 h-3.5" /> Town Discussion & Trial Phase
        </div>

        {/* Night Casualty Announcement Banner */}
        {gameState.last_night_killed ? (
          <div className="flex flex-col items-center gap-2 mb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-red-400">
              Tragedy in the Night
            </span>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-red-950/40 border border-red-800/80 text-red-300 font-serif text-2xl sm:text-3xl font-bold shadow-xl">
              <Skull className="w-7 h-7 text-red-500" />
              <span>{gameState.last_night_killed} was killed</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 mb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
              Peaceful Dawn
            </span>
            <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-300 font-serif text-xl sm:text-2xl font-semibold">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span>No casualties were reported last night</span>
            </div>
          </div>
        )}

        {/* Big TV Discussion Timer */}
        <div className="w-full max-w-md flex flex-col items-center gap-3 py-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] uppercase tracking-wider">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Discussion Timer Remaining</span>
          </div>

          <span className="font-mono text-6xl sm:text-7xl font-black tracking-tight text-white drop-shadow-md">
            {formattedTime}
          </span>

          {/* Progress Bar */}
          <div className="w-full bg-[#090A0F] h-3 rounded-full border border-[#1F2430] overflow-hidden p-0.5 mt-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                timerPercentage < 20 ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
              }`}
              style={{ width: `${timerPercentage}%` }}
            />
          </div>
        </div>

        {/* Host Manual Tally Trigger */}
        {isHost && (
          <div className="mt-6">
            <button
              onClick={tallyDayVotes}
              className="py-3 px-6 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500 text-amber-400 font-semibold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Vote className="w-4 h-4" />
              <span>End Discussion & Tally Votes Now</span>
            </button>
          </div>
        )}
      </div>

      {/* Live Voting & Player Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Living Players & Vote Count Indicator */}
        <div className="wope-card p-6 flex flex-col gap-4 text-left">
          <div className="flex items-center justify-between border-b border-[#1F2430] pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Living Town Members ({livingPlayers.length})</span>
            </div>
            <span className="text-xs font-mono text-[#94A3B8]">
              Votes In: {totalVotesCast}/{livingPlayers.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {livingPlayers.map((player) => {
              const hasVoted = Boolean(gameState.votes?.[player.socket_id]);

              return (
                <div
                  key={player.socket_id}
                  className="p-3 rounded-xl bg-[#090A0F] border border-[#1F2430] flex items-center justify-between"
                >
                  <span className="font-semibold text-sm text-white truncate max-w-[120px]">
                    {player.name}
                  </span>

                  {hasVoted ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Voted
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-[#64748B] px-2 py-0.5">
                      Deciding...
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cemetery / Dead Spectators */}
        <div className="wope-card p-6 flex flex-col gap-4 text-left">
          <div className="flex items-center justify-between border-b border-[#1F2430] pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-400">
              <Skull className="w-4 h-4 text-red-500" />
              <span>Cemetery & Eliminated ({deadPlayers.length})</span>
            </div>
          </div>

          {deadPlayers.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-[#64748B] p-8">
              No players have been eliminated yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {deadPlayers.map((player) => (
                <div
                  key={player.socket_id}
                  className="p-3 rounded-xl bg-[#090A0F]/60 border border-[#1F2430] flex items-center justify-between opacity-60"
                >
                  <span className="font-medium text-sm text-neutral-400 line-through truncate max-w-[120px]">
                    {player.name}
                  </span>
                  <span className="text-[10px] font-mono text-red-400 uppercase">
                    Dead
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default HostDayDisplay;
