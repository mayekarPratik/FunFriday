import React from 'react';
import { useWerewolfStore } from '../werewolfStore';
import { useCoreStore } from '../../../store/coreStore';
import { Trophy, Skull, RotateCcw, LogOut } from 'lucide-react';

export const GameOverDisplay: React.FC = () => {
  const { gameState, hostRestartGame } = useWerewolfStore();
  const { activeRoleMode, leaveRoom } = useCoreStore();

  if (!gameState) return null;

  const winner = gameState.winner || 'town';
  const isWolvesWin = winner === 'wolves';
  const isJesterWin = winner === 'jester';
  const isExecutionerWin = winner === 'executioner';
  const isLoversWin = winner === 'lovers';

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center gap-8 py-8">
      {/* Victory Card */}
      <div className="wope-card p-10 sm:p-14 w-full flex flex-col items-center relative overflow-hidden shadow-2xl">
        {/* Glow backdrop based on winner */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 blur-3xl rounded-full pointer-events-none ${
            isWolvesWin
              ? 'bg-red-600/20'
              : isLoversWin
              ? 'bg-pink-600/20'
              : isJesterWin || isExecutionerWin
              ? 'bg-purple-600/20'
              : 'bg-emerald-600/20'
          }`}
        />

        <div className="w-24 h-24 rounded-3xl bg-[#191C28] border border-[#1F2430] flex items-center justify-center mb-6 shadow-2xl">
          {isWolvesWin ? (
            <Skull className="w-14 h-14 text-red-500 animate-bounce" />
          ) : isLoversWin ? (
            <Trophy className="w-14 h-14 text-pink-400 animate-bounce" />
          ) : isJesterWin || isExecutionerWin ? (
            <Trophy className="w-14 h-14 text-purple-400 animate-bounce" />
          ) : (
            <Trophy className="w-14 h-14 text-emerald-400 animate-bounce" />
          )}
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono uppercase tracking-widest mb-3 border bg-[#090A0F]/80">
          {isWolvesWin ? (
            <span className="text-red-400">🐺 THE PACK PREVAILS</span>
          ) : isLoversWin ? (
            <span className="text-pink-400">❤️ LOVE CONQUERS ALL</span>
          ) : isJesterWin ? (
            <span className="text-purple-400">🃏 THE JESTER LAUGHS LAST</span>
          ) : isExecutionerWin ? (
            <span className="text-purple-400">🎯 EXECUTIONER's TRIUMPH</span>
          ) : (
            <span className="text-emerald-400">🛡️ VILLAGE TRIUMPH</span>
          )}
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase mb-4">
          {isWolvesWin
            ? 'Werewolves Win'
            : isLoversWin
            ? 'Lovers Win'
            : isJesterWin
            ? 'Jester Wins'
            : isExecutionerWin
            ? 'Executioner Wins'
            : 'Villagers Win'}
        </h1>

        <p className="text-sm sm:text-base text-[#94A3B8] max-w-lg mb-8">
          {isWolvesWin
            ? 'The Werewolves have successfully overrun the village in the shadows of the night.'
            : isLoversWin
            ? 'Against all odds, the linked lovers survived to the end and celebrate their secret union.'
            : isJesterWin
            ? 'The Jester tricked the village into casting a guilty verdict and achieved solo victory!'
            : isExecutionerWin
            ? 'The Executioner guided the town trial to eliminate their secret marked target!'
            : 'The village united to identify and eliminate every single Werewolf threat.'}
        </p>

        {/* Roles Reveal List */}
        <div className="w-full max-w-2xl bg-[#090A0F]/90 border border-[#1F2430] rounded-2xl p-6 flex flex-col gap-4 mb-8">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#94A3B8] flex items-center justify-between">
            <span>Player Roles Reveal</span>
            <span>{gameState.players.length} Players</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {gameState.players.map((player) => {
              const isWolf = player.role === 'wolf' || player.role === 'werewolf';
              const isDead = !player.is_alive;

              return (
                <div
                  key={player.socket_id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    isWolf
                      ? 'bg-red-950/20 border-red-900/40 text-red-300'
                      : player.role === 'jester' || player.role === 'executioner'
                      ? 'bg-purple-950/20 border-purple-900/40 text-purple-300'
                      : player.is_lover
                      ? 'bg-pink-950/20 border-pink-900/40 text-pink-300'
                      : 'bg-[#12141C] border-[#1F2430] text-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isDead ? 'line-through text-[#64748B]' : ''}`}>
                      {player.name}
                    </span>
                    {player.is_lover && <span className="text-[10px] text-pink-400">❤️</span>}
                  </div>

                  <span className="font-mono uppercase font-bold tracking-wider text-[11px]">
                    {player.role || 'Villager'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Host Restart / Return to Hub Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {activeRoleMode === 'host' ? (
            <>
              <button
                type="button"
                onClick={hostRestartGame}
                className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] font-bold text-sm text-white shadow-lg shadow-[#3B82F6]/25 transition flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <RotateCcw className="w-4 h-4" /> Play Again (Same Room)
              </button>

              <button
                type="button"
                onClick={leaveRoom}
                className="py-3.5 px-6 rounded-xl bg-[#191C28] hover:bg-[#1F2430] border border-[#1F2430] text-[#94A3B8] hover:text-white font-medium text-sm transition flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Exit to Game Hub
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={leaveRoom}
              className="py-3.5 px-8 rounded-xl bg-[#191C28] hover:bg-[#1F2430] border border-[#1F2430] text-[#94A3B8] hover:text-white font-medium text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Exit to Game Hub
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameOverDisplay;
