import React, { useEffect } from 'react';
import { useMafiaStore } from './mafiaStore';
import { useCoreStore } from '../../store/coreStore';
import { MafiaHost } from './MafiaHost';
import { MafiaClient } from './MafiaClient';

export const MafiaMaster: React.FC = () => {
  const { syncFromBackend, players: mafiaPlayers, setMafiaState } = useMafiaStore();
  const { socket, activeRoleMode, roomCode, players: corePlayers } = useCoreStore();

  const isHost = activeRoleMode === 'host';

  // Initialize mafiaStore from coreStore on mount or when corePlayers change
  useEffect(() => {
    if (corePlayers.length > 0 && mafiaPlayers.length === 0) {
      syncFromBackend({
        room_code: roomCode,
        players: corePlayers
      });
    }
  }, [corePlayers, roomCode, mafiaPlayers.length, syncFromBackend]);

  useEffect(() => {
    if (!socket) return;

    const handleMafiaState = (data: any) => {
      if (data) {
        syncFromBackend(data);
      }
    };

    const handleGameState = (data: any) => {
      if (data && data.mafiaState) {
        syncFromBackend(data.mafiaState);
      } else if (data && data.game_id === 'mafia') {
        syncFromBackend(data);
      }
    };

    const handleActionsLocked = () => {
      setMafiaState({ allActionsLocked: true });
    };

    socket.on('mafia_state_update', handleMafiaState);
    socket.on('game_state_update', handleGameState);
    socket.on('mafia_day_started', (res: any) => {
      if (res && res.state) syncFromBackend(res.state);
    });
    socket.on('all_actions_locked', handleActionsLocked);

    return () => {
      socket.off('mafia_state_update', handleMafiaState);
      socket.off('game_state_update', handleGameState);
      socket.off('mafia_day_started');
      socket.off('all_actions_locked', handleActionsLocked);
    };
  }, [socket, syncFromBackend, setMafiaState]);

  return isHost ? <MafiaHost /> : <MafiaClient />;
};

export default MafiaMaster;
