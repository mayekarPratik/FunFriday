import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Trophy, Skull, Users, RotateCcw, Crown } from 'lucide-react';

export const GameOverDisplay: React.FC = () => {
  const { gameState, leaveRoom, createRoom, activeRoleMode } = useGameStore();

  if (!gameState) return null;

  const winner = gameState.winner || 'villagers';
  const isWolvesWin = winner === 'wolves';

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center gap-8 py-8">
      {/* Victory Card */}
      <div className="wope-card p-10 sm:p-14 w-full flex flex-col items-center relative overflow-hidden shadow-2xl">
        {/* Glow backdrop based on winner */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 blur-3xl rounded-full pointer-events-none ${
            isWolvesWin ? 'bg-red-600/20' : 'bg-emerald-600/20'
          }`}
        />

        <div className="w-24 h-24 rounded-3xl bg-[#191C28] border border-[#1F2430] flex items-center justify-center mb-6 shadow-2xl">
          {isWolvesWin ? (
            <Skull className="w-14 h-14 text-red-500 animate-bounce" />
          ) : (
            <Trophy className="w-14 h-14 text-emerald-400 animate-bounce" />
          )}
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono uppercase tracking-widest mb-3 border bg-[#090A0F]/80">
          {isWolvesWin ? (
            <span className="text-red-400">🐺 THE PACK PREVAILS</span>
          ) : (
            <span className="text-emerald-400">🛡️ THE TOWN IS SAVED</span>
          )}
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#F8FAFC] mb-3">
          {isWolvesWin ? 'Werewolves Win!' : 'Villagers Win!'}
        </h1>
        <p className="text-sm sm:text-base text-[#94A3B8] max-w-md mb-8">
          {isWolvesWin
            ? 'The Werewolves successfully outnumbered the innocent townspeople.'
            : 'All Werewolves have been discovered and eliminated by the village.'}
        </p>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={leaveRoom}
            className="wope-btn-secondary px-6 py-3 text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Return to Main Menu
          </button>
          {activeRoleMode === 'host' && (
            <button
              onClick={() => createRoom()}
              className="wope-btn-primary px-6 py-3 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-[#3B82F6]/25"
            >
              <Crown className="w-4 h-4" /> Host Another Game
            </button>
          )}
        </div>
      </div>

      {/* Role Reveal Table */}
      <div className="w-full flex flex-col gap-4 text-left">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#3B82F6]" /> Final Role Revelations
          </h3>
          <span className="text-xs font-mono text-[#94A3B8]">
            {gameState.players.length} Total Players
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full">
          {gameState.players.map((player) => (
            <div
              key={player.socket_id}
              className={`wope-card p-4 flex items-center justify-between border ${
                player.role === 'wolf'
                  ? 'border-red-900/50 bg-red-950/20'
                  : player.role === 'seer'
                  ? 'border-blue-900/50 bg-blue-950/20'
                  : player.role === 'doctor'
                  ? 'border-emerald-900/50 bg-emerald-950/20'
                  : 'border-[#1F2430] bg-[#12141C]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#090A0F] border border-[#1F2430] flex items-center justify-center font-bold text-sm text-[#F8FAFC]">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm text-[#F8FAFC]">{player.name}</p>
                  <p className="text-[11px] font-mono text-[#94A3B8]">
                    {player.is_alive ? 'Survived' : 'Eliminated'}
                  </p>
                </div>
              </div>

              <span
                className={`wope-badge font-bold uppercase text-[11px] ${
                  player.role === 'wolf'
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : player.role === 'seer'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    : player.role === 'doctor'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-white/5 text-neutral-300 border-white/10'
                }`}
              >
                {player.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
