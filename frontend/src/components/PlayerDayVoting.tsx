import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Sun, Vote, Skull, CheckCircle2, Sparkles } from 'lucide-react';

export const PlayerDayVoting: React.FC = () => {
  const { gameState, getMyPlayer, submitVote } = useGameStore();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const me = getMyPlayer();

  if (!gameState || !me) {
    return (
      <div className="min-h-screen bg-[#090A0F] text-[#94A3B8] flex items-center justify-center p-6 text-center font-mono text-sm">
        Syncing day voting session...
      </div>
    );
  }

  const isAlive = me.is_alive;
  const myVote = gameState.votes?.[me.socket_id] || selectedTarget;

  const livingPlayers = gameState.players.filter((p) => p.is_alive);
  const otherLivingPlayers = livingPlayers.filter((p) => p.socket_id !== me.socket_id);

  const isExecutioner = me.role === 'executioner';
  const executionerTargetId = gameState.role_states?.executioner?.target_id;
  const targetPlayer = executionerTargetId
    ? gameState.players.find((p) => p.socket_id === executionerTargetId)
    : null;
  const targetName = targetPlayer ? targetPlayer.name : 'Unknown';

  const handleVote = (targetSocketId: string) => {
    if (!isAlive) return;
    setSelectedTarget(targetSocketId);
    submitVote(targetSocketId);
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-5 pb-8 relative">
      {/* Executioner Target Banner */}
      {isExecutioner && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 pointer-events-none z-10 whitespace-nowrap">
          <span className="text-purple-500 text-sm font-bold tracking-widest">
            TARGET: {targetName}
          </span>
        </div>
      )}

      {/* Header Info */}
      <div className="wope-card p-5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-semibold block">
              Day Phase Trial
            </span>
            <h2 className="text-base font-bold text-[#F8FAFC]">Cast Your Vote</h2>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-mono text-[#94A3B8] block">Your Status</span>
          <span
            className={`wope-badge ${
              isAlive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}
          >
            {isAlive ? 'ALIVE' : 'ELIMINATED'}
          </span>
        </div>
      </div>

      {/* Dead Player Spectator Message */}
      {!isAlive ? (
        <div className="wope-card p-8 text-center flex flex-col items-center gap-4 border-red-900/30 bg-red-950/10">
          <div className="w-14 h-14 rounded-2xl bg-red-950/50 border border-red-800/80 flex items-center justify-center text-red-500">
            <Skull className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">You are Spectating</h3>
            <p className="text-xs text-[#94A3B8] max-w-xs mx-auto">
              You were eliminated. You can watch the trial unfold on the TV, but cannot vote or speak during trials.
            </p>
          </div>
        </div>
      ) : (
        /* Living Player Voting Grid */
        <div className="wope-card p-6 flex flex-col gap-5 shadow-2xl">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <Vote className="w-4 h-4 text-[#3B82F6]" />
              Select a player to accuse & eliminate:
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Vote for the player you suspect is a Werewolf.
            </p>
          </div>

          <div className="space-y-2.5">
            {otherLivingPlayers.map((player) => {
              const isVoted = myVote === player.socket_id;
              return (
                <button
                  key={player.socket_id}
                  onClick={() => handleVote(player.socket_id)}
                  className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-sm font-medium transition cursor-pointer ${
                    isVoted
                      ? 'bg-[#3B82F6]/15 border-[#3B82F6] text-[#F8FAFC] shadow-md'
                      : 'bg-[#090A0F] border-[#1F2430] text-[#94A3B8] hover:border-[#2e3648] hover:text-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#191C28] border border-[#1F2430] flex items-center justify-center font-bold text-xs text-[#F8FAFC]">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm">{player.name}</span>
                  </div>

                  {isVoted ? (
                    <span className="text-xs font-mono text-[#3B82F6] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Voted
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-[#94A3B8] opacity-60">
                      Vote
                    </span>
                  )}
                </button>
              );
            })}

            {/* Skip Vote Option */}
            <button
              onClick={() => handleVote('skip')}
              className={`w-full p-3 rounded-xl border flex items-center justify-center text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
                myVote === 'skip'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                  : 'bg-[#090A0F]/50 border-[#1F2430] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              {myVote === 'skip' ? '✓ Vote to Skip / Abstain' : 'Abstain / Skip Vote'}
            </button>
          </div>

          {myVote && (
            <div className="p-3 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 text-xs font-mono text-[#22C55E] text-center">
              ✓ Your vote is locked in. You can change it until time expires.
            </div>
          )}
        </div>
      )}

      {/* Secret Role Reminder */}
      <div className="p-3.5 rounded-xl bg-[#12141C] border border-[#1F2430] flex items-center justify-between text-xs font-mono">
        <span className="text-[#94A3B8] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" /> Secret Role:
        </span>
        <span className="font-bold text-[#F8FAFC] uppercase">{me.role}</span>
      </div>
    </div>
  );
};
