import React, { useEffect } from 'react';
import { useMafiaStore } from './mafiaStore';
import { useCoreStore } from '../../store/coreStore';
import { MafiaHost } from './MafiaHost';
import { MafiaClient } from './MafiaClient';

export const MafiaMaster: React.FC = () => {
  const { syncFromBackend, resetGame, setMafiaState } = useMafiaStore();
  const { socket, activeRoleMode, roomCode, players: corePlayers } = useCoreStore();

  const isHost = activeRoleMode === 'host';

  // Initialize fresh mafiaStore state from coreStore on mount
  useEffect(() => {
    resetGame();
    if (corePlayers.length > 0) {
      syncFromBackend({
        room_code: roomCode,
        phase: 'LOBBY',
        players: corePlayers.map((p) => ({
          socket_id: p.socket_id,
          name: p.name,
          role: 'citizen',
          is_alive: true
        }))
      });
    }

    return () => {
      resetGame();
    };
  }, [roomCode]);

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

    const handleDetectiveResult = (res: any) => {
      if (res) {
        setMafiaState({
          myInvestigation: {
            target_socket_id: res.target_socket_id || res.targetId,
            target_name: res.targetName || res.target_name,
            targetName: res.targetName || res.target_name,
            alignment: res.alignment || (res.is_mafia ? 'Mafia' : 'Citizen'),
            is_mafia: res.is_mafia ?? (res.alignment === 'Mafia')
          }
        });
      }
    };

    socket.on('mafia_state_update', handleMafiaState);
    socket.on('game_state_update', handleGameState);
    socket.on('mafia_day_started', (res: any) => {
      if (res && res.state) syncFromBackend(res.state);
    });
    socket.on('all_actions_locked', handleActionsLocked);
    socket.on('detective_result', handleDetectiveResult);
    socket.on('mafia_investigation_result', handleDetectiveResult);

    return () => {
      socket.off('mafia_state_update', handleMafiaState);
      socket.off('game_state_update', handleGameState);
      socket.off('mafia_day_started');
      socket.off('all_actions_locked', handleActionsLocked);
      socket.off('detective_result', handleDetectiveResult);
      socket.off('mafia_investigation_result', handleDetectiveResult);
    };
  }, [socket, syncFromBackend, setMafiaState]);

  return isHost ? <MafiaHost /> : <MafiaClient />;
};

export default MafiaMaster;
