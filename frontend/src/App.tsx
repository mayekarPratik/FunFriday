import React, { useEffect, useState, useRef, Suspense, lazy } from 'react';
import { useCoreStore } from './store/coreStore';
import { LandingPage } from './hub/LandingPage';
import { HubLobbyHost } from './hub/HubLobbyHost';
import { HubLobbyPlayer } from './hub/HubLobbyPlayer';
import { ServerWakeupModal } from './components/ServerWakeupModal';
import { InteractiveBackground } from './components/InteractiveBackground';
import { Wifi, WifiOff, RefreshCw, AlertCircle, Shield } from 'lucide-react';

// Lazy load the isolated Werewolf Master module
const WerewolfMaster = lazy(() => import('./games/werewolf/WerewolfMaster'));

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

    const handleGameSelected = (data: { gameId: string; game_id?: string }) => {
      const selectedId = data?.gameId || data?.game_id;
      if (!selectedId) return;

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

    socket.on('game_selected', handleGameSelected);
    return () => {
      socket.off('game_selected', handleGameSelected);
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

    // 2. If in a room, but no game chosen yet, render the Game Hub Lobby
    if (!currentGameId) {
      return isHost ? <HubLobbyHost /> : <HubLobbyPlayer />;
    }

    // 3. If Werewolf is chosen, render lazy-loaded WerewolfMaster
    if (currentGameId === 'werewolf') {
      return (
        <Suspense
          fallback={
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-white">
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

    // Fallback for unrecognized gameId
    return isHost ? <HubLobbyHost /> : <HubLobbyPlayer />;
  };

  return (
    <div className="min-h-screen w-full bg-black overflow-hidden text-[#F8FAFC] flex flex-col justify-between selection:bg-[#3B82F6]/30 relative z-0">
      {/* Global Interactive Canvas Starfield */}
      <InteractiveBackground isLandingPage={!hasRoomCode} />

      {/* Global Server Wake-Up Overlay for Render.com cold starts */}
      {!isConnected && <ServerWakeupModal />}

      {/* Header bar (Visible in Hub / Games when roomCode exists and not in fullscreen pitch-black screens) */}
      {hasRoomCode && (
        <header className="h-16 border-b border-[#1F2430] bg-[#090A0F]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6]">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-wider text-sm uppercase text-[#F8FAFC]">
                FunFriday
              </span>
              <span className="text-[10px] font-mono text-[#94A3B8] -mt-1">
                {currentGameId ? `${currentGameId.toUpperCase()} MODE` : pendingGameId ? `${pendingGameId.toUpperCase()} LOADING...` : 'GAME HUB'}
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
      <main className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 my-auto w-full">
        <div className="w-full max-w-5xl flex flex-col items-center">
          {/* Error Banner */}
          {(connectionError || lastActionError) && (
            <div className="w-full max-w-md mb-6 p-4 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 backdrop-blur-md text-xs flex items-start gap-3 text-[#EF4444]">
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
            className={`w-full h-full origin-center ${
              tvState === 'turning_off'
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
        <footer className="py-4 border-t border-[#1F2430] bg-[#090A0F]/80 backdrop-blur-md text-center text-xs text-[#94A3B8]">
          <span>FunFriday Game Hub • Created by Pratik Mayekar</span>
        </footer>
      )}
    </div>
  );
};

export default App;

