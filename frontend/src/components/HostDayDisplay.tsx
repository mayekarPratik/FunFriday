import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Sun, Skull, ShieldCheck, Clock, Users, Vote, CheckCircle2, ChevronRight } from 'lucide-react';

export const HostDayDisplay: React.FC = () => {
  const { gameState, tallyDayVotes } = useGameStore();
  const [timeLeftMs, setTimeLeftMs] = useState<number>(300000);

  // Sync 5-minute countdown timer with absolute timestamp day_ends_at
  useEffect(() => {
    const endTimestamp = gameState?.day_ends_at || gameState?.timer_ends_at;
    if (!endTimestamp) return;

    const updateTimer = () => {
      const remaining = Math.max(0, endTimestamp - Date.now());
      setTimeLeftMs(remaining);

      // When timer expires, trigger automatic vote tally
      if (remaining === 0) {
        tallyDayVotes();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [gameState?.day_ends_at, gameState?.timer_ends_at, tallyDayVotes]);

  if (!gameState) return null;

  const minutes = Math.floor(timeLeftMs / 60000);
  const seconds = Math.floor((timeLeftMs % 60000) / 1000);
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const timerPercentage = Math.max(0, Math.min(100, (timeLeftMs / 300000) * 100));

  const livingPlayers = gameState.players.filter((p) => p.is_alive);
  const deadPlayers = gameState.players.filter((p) => !p.is_alive);
  const totalVotesCast = Object.keys(gameState.votes || {}).length;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center text-center gap-8 py-4">
      {/* Top Casualty & Day Header */}
      <div className="wope-card p-8 sm:p-10 w-full flex flex-col items-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase mb-4">
          <Sun className="w-3.5 h-3.5" /> Town Discussion & Trial Phase
        </div>

        {/* Night Casualty Announcement Banner */}
        <div className="w-full max-w-xl my-3 p-5 rounded-2xl border bg-[#090A0F]/80 flex items-center gap-4 text-left shadow-lg">
          {gameState.last_night_killed ? (
            <>
              <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-500 shrink-0">
                <Skull className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-semibold">
                  Night Casualty Report
                </span>
                <h2 className="text-xl font-bold text-white">
                  <span className="text-red-400">{gameState.last_night_killed}</span> was slain last night!
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  The Werewolves claimed a victim while the town slept.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                  Night Casualty Report
                </span>
                <h2 className="text-xl font-bold text-white">
                  Peaceful Night! Nobody died.
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  The Doctor successfully saved the victim or no attack succeeded.
                </p>
              </div>
            </>
          )}
        </div>

        {/* 5-Minute Countdown Timer Widget */}
        <div className="w-full max-w-md my-4 p-5 rounded-xl border border-[#1F2430] bg-[#12141C] flex flex-col items-center gap-3">
          <div className="flex items-center justify-between w-full text-xs font-mono text-[#94A3B8]">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#3B82F6]" /> Discussion Timer
            </span>
            <span className="text-amber-400 font-semibold">5:00 Max</span>
          </div>

          <div className="text-5xl font-black font-mono tracking-widest text-[#F8FAFC]">
            {formattedTime}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#090A0F] h-2 rounded-full overflow-hidden border border-[#1F2430]">
            <div
              className={`h-full transition-all duration-1000 ${
                timeLeftMs < 60000 ? 'bg-red-500' : 'bg-[#3B82F6]'
              }`}
              style={{ width: `${timerPercentage}%` }}
            />
          </div>

          <p className="text-xs text-[#94A3B8]">
            Discuss suspects. Players must submit their elimination vote on their phones.
          </p>
        </div>

        {/* Live Voting Progress & Host Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full pt-6 border-t border-[#1F2430]">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#191C28] border border-[#1F2430] flex items-center justify-center text-amber-400">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#F8FAFC]">
                Votes Cast: {totalVotesCast} / {livingPlayers.length}
              </p>
              <p className="text-xs text-[#94A3B8]">
                {totalVotesCast === livingPlayers.length
                  ? 'All votes in! Tallying automatically...'
                  : 'Waiting for players to submit or change their votes...'}
              </p>
            </div>
          </div>

          <button
            onClick={tallyDayVotes}
            className="wope-btn-primary px-5 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-[#3B82F6]/20"
          >
            <span>End Day Early & Tally</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Living vs Eliminated Player Grid */}
      <div className="w-full flex flex-col gap-4 text-left">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#3B82F6]" />
            Townspeople Roster ({livingPlayers.length} Alive / {deadPlayers.length} Eliminated)
          </h3>
          <span className="text-xs font-mono text-[#94A3B8]">
            {gameState.players.length} Total
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {gameState.players.map((player) => {
            const isAlive = player.is_alive;
            const hasVoted = Boolean(gameState.votes?.[player.socket_id]);

            return (
              <div
                key={player.socket_id}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                  isAlive
                    ? 'wope-card'
                    : 'bg-black/60 border-neutral-900 text-neutral-600 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                      isAlive
                        ? 'bg-[#1E293B] border-[#1F2430] text-[#F8FAFC]'
                        : 'bg-neutral-950 border-neutral-900 text-neutral-700'
                    }`}
                  >
                    {isAlive ? (
                      player.name.charAt(0).toUpperCase()
                    ) : (
                      <Skull className="w-4 h-4 text-red-700" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-semibold truncate ${
                      isAlive ? 'text-[#F8FAFC]' : 'line-through text-neutral-600'
                    }`}
                  >
                    {player.name}
                  </span>
                </div>

                {isAlive ? (
                  hasVoted ? (
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Voted
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#94A3B8] opacity-60">
                      Thinking
                    </span>
                  )
                ) : (
                  <span className="text-[10px] font-mono text-red-900 uppercase font-bold flex items-center gap-1">
                    💀 Dead
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
