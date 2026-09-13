import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Skull, Eye } from 'lucide-react';
import { NightPhase } from '../components/NightPhase';
import { PlayerDayVoting } from '../components/PlayerDayVoting';
import { PlayerWaiting } from '../components/PlayerWaiting';

export const PlayerView: React.FC = () => {
  const { gameState, getMyPlayer } = useGameStore();

  if (!gameState) return null;

  const me = getMyPlayer();

  // Top-level eliminated check: if player is dead, override everything and render Spectator Screen
  if (me && !me.is_alive && gameState.phase !== 'game_over' && gameState.phase !== 'lobby') {
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

        <div className="absolute bottom-8 flex items-center gap-2 text-neutral-600 text-xs font-mono tracking-widest uppercase">
          <Eye className="w-4 h-4" />
          <span>Silent Spectator</span>
        </div>
      </div>
    );
  }

  // Active living player rendering per phase
  if (gameState.phase === 'night') {
    return <NightPhase />;
  }

  if (gameState.phase === 'morning_recap' || gameState.phase === 'dusk_recap') {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 z-50 select-none">
        <div className="max-w-md text-center px-4">
          <h2 className="text-2xl sm:text-3xl font-serif text-gray-300 animate-pulse tracking-wide font-light">
            Look at the Host Screen...
          </h2>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'day') {
    return <PlayerDayVoting />;
  }

  return <PlayerWaiting />;
};

export default PlayerView;
