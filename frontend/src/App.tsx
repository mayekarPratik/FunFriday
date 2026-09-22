import React, { useEffect, useState, useRef, Suspense, lazy } from 'react';
import { useCoreStore } from './store/coreStore';
import { LandingPage } from './lobby/LandingPage';
import { LobbyHost } from './lobby/LobbyHost';
import { LobbyClient } from './lobby/LobbyClient';
import { ServerWakeupModal } from './components/ServerWakeupModal';
import { InteractiveBackground } from './components/InteractiveBackground';
import { Wifi, WifiOff, RefreshCw, AlertCircle, Shield } from 'lucide-react';

import { useMafiaStore } from './games/mafia/mafiaStore';
import { useWerewolfStore } from './games/werewolf/werewolfStore';

// Lazy load the isolated Game modules
const WerewolfMaster = lazy(() => import('./games/werewolf/WerewolfMaster'));
const MafiaMaster = lazy(() => import('./games/mafia/MafiaMaster'));

export const App: React.FC = () => {
  const {
    socket,
    isConnected,
    isConnecting,
    connectionError,
    roomCode,
    activeRoleMode,
    currentGameId,
    setCurrentGameId,
    lastActionError,
    initSocket,
    clearErrors
  } = useCoreStore();

  const [tvState, setTvState] = useState<'idle' | 'turning_off' | 'turning_on'>('idle');
  const [pendingGameId, setPendingGameId] = useState<string | null>(null);

  const offTimeoutRef = useRef<number | null>(null);
  const onTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  // Intercept socket event for game_selected with 600ms CRT Off / On cinematic sequence
  useEffect(() => {
    if (!socket) return;

    const handleGameSelected = (data: { gameId: string | null; game_id?: string | null }) => {
      const selectedId = data?.gameId !== undefined ? data.gameId : data?.game_id;

      // If returning to hub (gameId is null / falsy), instantly clear currentGameId and reset module stores
      if (!selectedId) {
        setCurrentGameId(null);
        setPendingGameId(null);
        setTvState('idle');
        useMafiaStore.getState().resetGame();
        useWerewolfStore.getState().resetGame();
        return;
      }

      // Clear any prior transition timers
      if (offTimeoutRef.current) clearTimeout(offTimeoutRef.current);
      if (onTimeoutRef.current) clearTimeout(onTimeoutRef.current);

      setPendingGameId(selectedId);
      setTvState('turning_off');

      // 1. After 600ms (matching crtOff duration), update currentGameId in Zustand & trigger crtOn
      offTimeoutRef.current = setTimeout(() => {
        setCurrentGameId(selectedId);
        setTvState('turning_on');
        setPendingGameId(null);

        // 2. After another 600ms (matching crtOn duration), reset to idle
        onTimeoutRef.current = setTimeout(() => {
          setTvState('idle');
        }, 600);
      }, 600);
    };

    const handleReturnedToLobby = () => {
      setCurrentGameId(null);
      setPendingGameId(null);
      setTvState('idle');
      useMafiaStore.getState().resetGame();
      useWerewolfStore.getState().resetGame();
    };

    const handleHostDisconnected = (data: { room_code?: string; message?: string }) => {
      console.warn('[App] Host disconnected event received:', data);
      setCurrentGameId(null);
      setPendingGameId(null);
      setTvState('idle');
      useMafiaStore.getState().resetGame();
      useWerewolfStore.getState().resetGame();

      // Clear any stored local keys
      try {
        localStorage.removeItem('roomCode');
        localStorage.removeItem('playerId');
        localStorage.removeItem('room_code');
        localStorage.removeItem('player_id');
        localStorage.removeItem('myPlayerName');
      } catch {}
    };

    socket.on('game_selected', handleGameSelected);
    socket.on('returned_to_lobby', handleReturnedToLobby);
    socket.on('host_disconnected', handleHostDisconnected);

    return () => {
      socket.off('game_selected', handleGameSelected);
      socket.off('returned_to_lobby', handleReturnedToLobby);
      socket.off('host_disconnected', handleHostDisconnected);
      if (offTimeoutRef.current) clearTimeout(offTimeoutRef.current);
      if (onTimeoutRef.current) clearTimeout(onTimeoutRef.current);
    };
  }, [socket, setCurrentGameId]);

  const hasRoomCode = Boolean(roomCode);
  const isHost = activeRoleMode === 'host';

  const renderRouterOutlet = () => {
    // 1. If no room joined or created, render the Landing Page
    if (!hasRoomCode) {
      return <LandingPage />;
    }

    // 2. If in a room, but no game chosen yet, render The Lobby Host or Client screen
    if (!currentGameId) {
      return isHost ? <LobbyHost /> : <LobbyClient />;
    }

    // 3. If Werewolf is chosen, render lazy-loaded WerewolfMaster
    if (currentGameId === 'werewolf') {
      return (
        <Suspense
          fallback={
            <div className="flex-1 w-full h-full flex flex-col items-center justify-center gap-4 text-white">
              <RefreshCw className="w-8 h-8 text-[#3B82F6] animate-spin" />
              <span className="font-mono text-xs uppercase tracking-widest text-[#94A3B8]">
                Loading Werewolf Module...
              </span>
            </div>
          }
        >
          <WerewolfMaster />
        </Suspense>
      );
    }

    // 4. If Mafia is chosen, render lazy-loaded MafiaMaster
    if (currentGameId === 'mafia') {
      return (
        <Suspense
          fallback={
            <div className="flex-1 w-full h-full flex flex-col items-center justify-center gap-4 text-white">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <span className="font-mono text-xs uppercase tracking-widest text-[#94A3B8]">
                Loading Mafia Module...
              </span>
            </div>
          }
        >
          <MafiaMaster />
        </Suspense>
      );
    }

    // Fallback for unrecognized gameId
    return isHost ? <LobbyHost /> : <LobbyClient />;
  };

  return (
    <div className="h-[100dvh] w-full bg-black overflow-hidden text-[#F8FAFC] flex flex-col justify-between selection:bg-[#3B82F6]/30 relative z-0 box-border">
      {/* Global Interactive Canvas Starfield */}
      <InteractiveBackground isLandingPage={!hasRoomCode} />

      {/* Global Server Wake-Up Overlay for Render.com cold starts */}
      {!isConnected && <ServerWakeupModal />}

      {/* Header bar (Visible in Lobby / Games when roomCode exists and not in fullscreen pitch-black screens) */}
      {hasRoomCode && (
        <header className="h-16 shrink-0 border-b border-[#1F2430] bg-[#090A0F]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6]">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-wider text-sm uppercase text-[#F8FAFC]">
                The Lobby
              </span>
              <span className="text-[10px] font-mono text-[#94A3B8] -mt-1">
                {currentGameId ? `${currentGameId.toUpperCase()} MODE` : pendingGameId ? `${pendingGameId.toUpperCase()} LOADING...` : 'CORE HUB'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1F2430] bg-[#12141C]/80 backdrop-blur-md text-xs font-mono">
              {isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                  <Wifi className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span className="text-[#94A3B8]">Connected</span>
                </>
              ) : isConnecting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[#EAB308] animate-spin" />
                  <span className="text-[#EAB308]">Connecting...</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span className="text-[#EF4444]">Offline</span>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className="flex-1 min-h-0 w-full flex flex-col justify-center items-center p-3 sm:p-6 overflow-hidden">
        <div className="w-full max-w-5xl h-full min-h-0 flex flex-col items-center justify-center">
          {/* Error Banner */}
          {(connectionError || lastActionError) && (
            <div className="w-full max-w-md shrink-0 mb-4 p-4 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 backdrop-blur-md text-xs flex items-start gap-3 text-[#EF4444]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{connectionError || lastActionError}</p>
                <button
                  onClick={() => {
                    clearErrors();
                    if (connectionError) initSocket();
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EF4444]/20 hover:bg-[#EF4444]/30 font-medium transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Dismiss & Retry
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Router Outlet wrapped in CRT TV animated container */}
          <div
            className={`w-full h-full min-h-0 flex flex-col items-center justify-center origin-center ${tvState === 'turning_off'
                ? 'animate-crt-off'
                : tvState === 'turning_on'
                  ? 'animate-crt-on'
                  : ''
              }`}
          >
            {renderRouterOutlet()}
          </div>
        </div>
      </main>

      {/* Footer (only if not landing page since landing page has its own footer) */}
      {hasRoomCode && (
        <footer className="shrink-0 py-3 border-t border-[#1F2430] bg-[#090A0F]/80 backdrop-blur-md text-center text-xs text-[#94A3B8]">
          <span>The Lobby • Multiplayer Game Hub</span>
        </footer>
      )}
    </div>
  );
};

export default App;

