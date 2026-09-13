import React, { useEffect } from 'react';
import { useWerewolfStore } from './werewolfStore';
import { useCoreStore } from '../../store/coreStore';
import { HostDashboard } from './components/HostDashboard';
import { HostNightDisplay } from './components/HostNightDisplay';
import { HostDayDisplay } from './components/HostDayDisplay';
import { PlayerDayVoting } from './components/PlayerDayVoting';
import { PlayerWaiting } from './components/PlayerWaiting';
import { GameOverDisplay } from './components/GameOverDisplay';
import { PlayerView } from './views/PlayerView';

export const WerewolfMaster: React.FC = () => {
  const { gameState, syncFromGameState } = useWerewolfStore();
  const { socket, activeRoleMode } = useCoreStore();

  const isHost = activeRoleMode === 'host';

  // Listen to game_state_update directly on core socket to keep werewolfStore updated
  useEffect(() => {
    if (!socket) return;

    const handleStateUpdate = (newState: any) => {
      if (newState) {
        syncFromGameState(newState);
      }
    };

    socket.on('game_state_update', handleStateUpdate);
    return () => {
      socket.off('game_state_update', handleStateUpdate);
    };
  }, [socket, syncFromGameState]);

  // If in active game and not host, delegate all player rendering (including dead spectator mode) to PlayerView
  if (gameState && !isHost && gameState.phase !== 'game_over') {
    return <PlayerView />;
  }

  // Active game phase views (Host & Game Over)
  if (gameState) {
    if (gameState.phase === 'game_over') {
      return <GameOverDisplay />;
    }
    if (gameState.phase === 'night' || gameState.phase === 'morning_recap' || gameState.phase === 'dusk_recap') {
      return <HostNightDisplay />;
    }
    if (gameState.phase === 'day') {
      return isHost ? <HostDayDisplay /> : <PlayerDayVoting />;
    }
  }

  // Pre-game / Role Configuration Lobby
  return isHost ? <HostDashboard /> : <PlayerWaiting />;
};

export default WerewolfMaster;
