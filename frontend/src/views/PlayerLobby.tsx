import React from 'react';
import { useGameStore } from '../store/gameStore';

export const PlayerLobby: React.FC = () => {
  const { gameState } = useGameStore();

  if (!gameState) return null;

  // If in morning_recap or dusk_recap, show pitch-black screen instructing to look at Host Screen
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

  return null;
};

export default PlayerLobby;
