import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { HostDashboard } from './components/HostDashboard';
import { PlayerWaiting } from './components/PlayerWaiting';
import { HostNightDisplay } from './components/HostNightDisplay';
import { HostDayDisplay } from './components/HostDayDisplay';
import { PlayerDayVoting } from './components/PlayerDayVoting';
import { GameOverDisplay } from './components/GameOverDisplay';
import { PlayerView } from './views/PlayerView';
import { LandingPage } from './views/LandingPage';
import { ServerWakeupModal } from './components/ServerWakeupModal';
import { InteractiveBackground } from './components/InteractiveBackground';
import { Wifi, WifiOff, RefreshCw, AlertCircle, Shield } from 'lucide-react';

export const App: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    connectionError,
    gameState,
    activeRoleMode,
    lastActionError,
    initSocket,
    clearErrors
  } = useGameStore();

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  const hasRoomCode = Boolean(gameState?.room_code);
  const isHost = activeRoleMode === 'host';

  const renderContent = () => {
    // If no room is joined / created yet, render the OLED Landing Page
    if (!hasRoomCode) {
      return <LandingPage />;
    }

    // If in active game and not host, delegate all player rendering (including dead spectator mode) to PlayerView
    if (gameState && !isHost && gameState.phase !== 'game_over') {
      return <PlayerView />;
    }

    return (
      <div className="min-h-screen text-[#F8FAFC] flex flex-col justify-between selection:bg-[#3B82F6]/30 relative z-0">
        {/* Header bar */}
        <header className="h-16 border-b border-[#1F2430] bg-[#090A0F]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6]">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-bold tracking-wider text-sm uppercase text-[#F8FAFC]">
              FunFriday Games
            </span>
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

        {/* Main Container */}
        <main className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 my-auto">
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
                    <RefreshCw className="w-3 h-3" /> Dismiss & Retry
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic Game Phase Routing */}
            {gameState && (
              gameState.phase === 'game_over' ? (
                <GameOverDisplay />
              ) : gameState.phase === 'night' || gameState.phase === 'morning_recap' || gameState.phase === 'dusk_recap' ? (
                <HostNightDisplay />
              ) : gameState.phase === 'day' ? (
                isHost ? (
                  <HostDayDisplay />
                ) : (
                  <PlayerDayVoting />
                )
              ) : isHost ? (
                <HostDashboard />
              ) : (
                <PlayerWaiting />
              )
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="py-4 border-t border-[#1F2430] bg-[#090A0F]/80 backdrop-blur-md text-center text-xs text-[#94A3B8]">
          <span>A Multiplayer Party Game • Created by Pratik Mayekar</span>
        </footer>
      </div>
    );
  };

  return (
    <>
      {/* Global Interactive Canvas Starfield (Constellations on Landing Page, Peaceful Drift in Games) */}
      <InteractiveBackground isLandingPage={!hasRoomCode} />

      {/* Global Server Wake-Up Overlay for Render.com cold starts */}
      {!isConnected && <ServerWakeupModal />}

      {/* Content */}
      {renderContent()}
    </>
  );
};

export default App;
