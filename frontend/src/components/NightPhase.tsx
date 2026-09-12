import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { ROLE_PRIORITIES } from '../types/game';
import { Moon, Eye, Shield, Crosshair, Skull, Sparkles, HeartPulse, CheckCircle2, Clock } from 'lucide-react';

const REVEAL_DURATION_MS = 4000;

export const NightPhase: React.FC = () => {
  const { gameState, getMyPlayer, submitNightAction } = useGameStore();

  const [isRevealed, setIsRevealed] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(REVEAL_DURATION_MS);
  const [actionConfirmed, setActionConfirmed] = useState(false);

  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const me = getMyPlayer();

  const clearAllTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const hideScreen = () => {
    clearAllTimers();
    setIsRevealed(false);
    setTimeLeftMs(REVEAL_DURATION_MS);
  };

  const handleCheckTurn = () => {
    if (isRevealed) return;

    clearAllTimers();
    setIsRevealed(true);
    setTimeLeftMs(REVEAL_DURATION_MS);

    const startTime = Date.now();

    // 100ms interval for smooth progress bar and countdown
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, REVEAL_DURATION_MS - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        hideScreen();
      }
    }, 50);

    // Hard 4-second timeout
    timeoutRef.current = setTimeout(() => {
      hideScreen();
    }, REVEAL_DURATION_MS);
  };

  const handleSelectTarget = (targetSocketId: string) => {
    // 1. Immediately clear timeout
    clearAllTimers();

    // 2. Fire submit_action / submitNightAction socket event
    submitNightAction(targetSocketId);

    // 3. Force screen back to pitch black showing subtle 'Action Confirmed' text
    setIsRevealed(false);
    setActionConfirmed(true);
    setTimeLeftMs(REVEAL_DURATION_MS);
  };

  if (!gameState || !me) {
    return (
      <div className="min-h-screen bg-black text-[#94A3B8] flex items-center justify-center p-6 text-center font-mono text-sm">
        Syncing player identity...
      </div>
    );
  }

  const myRole = me.role || 'villager';
  const myPriority = ROLE_PRIORITIES[myRole] ?? 0;
  const isMyTurn =
    (gameState.active_role && gameState.active_role === myRole) ||
    (myPriority > 0 && gameState.active_role_priority === myPriority);

  const otherAlivePlayers = gameState.players.filter(
    (p) => p.socket_id !== me.socket_id && p.is_alive
  );

  const secondsRemaining = Math.ceil(timeLeftMs / 1000);
  const progressPercent = Math.max(0, Math.min(100, (timeLeftMs / REVEAL_DURATION_MS) * 100));

  return (
    <div
      className="min-h-screen w-full bg-black text-white flex flex-col justify-between p-4 sm:p-6 select-none touch-manipulation"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Discreet Header */}
      <header className="flex items-center justify-between py-2 border-b border-white/5 opacity-40">
        <div className="flex items-center gap-2 font-mono text-xs text-neutral-400">
          <Moon className="w-3.5 h-3.5" />
          <span>NIGHT PHASE</span>
        </div>
        <div className="font-mono text-xs text-neutral-500">
          ROOM: {gameState.room_code}
        </div>
      </header>

      {/* Main Secret Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center my-auto py-6">
        {isRevealed ? (
          <div className="w-full max-w-sm flex flex-col items-center text-center animate-fadeIn">
            {/* 4-Second Timed Reveal Countdown Banner */}
            <div className="w-full mb-6 p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400 animate-spin" /> Auto-hiding in:
                </span>
                <span className="font-bold text-amber-400 text-sm">
                  {secondsRemaining}s
                </span>
              </div>
              {/* Shrinking Tailwind Progress Bar */}
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-75 ease-linear rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {isMyTurn ? (
              /* ACTIVE TURN INTERFACE */
              <div className="w-full flex flex-col items-center gap-4">
                {/* Role Identity Tag */}
                <div className="flex flex-col items-center gap-2">
                  {myRole === 'wolf' && (
                    <div className="w-14 h-14 rounded-2xl bg-red-950/50 border border-red-800/80 flex items-center justify-center text-red-500 shadow-lg shadow-red-950/50">
                      <Skull className="w-8 h-8" />
                    </div>
                  )}
                  {myRole === 'doctor' && (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-950/50 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
                      <HeartPulse className="w-8 h-8" />
                    </div>
                  )}
                  {myRole === 'seer' && (
                    <div className="w-14 h-14 rounded-2xl bg-blue-950/50 border border-blue-800/80 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-950/50">
                      <Eye className="w-8 h-8" />
                    </div>
                  )}

                  <span className="px-3 py-0.5 rounded-full text-xs font-mono uppercase tracking-widest border border-white/10 bg-white/5 text-neutral-300">
                    YOUR ROLE: {myRole.toUpperCase()}
                  </span>

                  <h2 className="text-xl font-bold tracking-tight text-white mt-1">
                    {myRole === 'wolf' && 'Choose Your Victim'}
                    {myRole === 'doctor' && 'Choose Who to Protect'}
                    {myRole === 'seer' && 'Inspect Alignment'}
                  </h2>
                </div>

                {/* Role Specific Action Target Buttons */}
                <div className="w-full space-y-2 mt-2">
                  <div className="text-[11px] font-mono uppercase text-neutral-500 text-left px-1">
                    Tap to submit action:
                  </div>

                  {otherAlivePlayers.map((player) => (
                    <button
                      key={player.socket_id}
                      onClick={() => handleSelectTarget(player.socket_id)}
                      className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-sm font-medium transition active:scale-[0.98] cursor-pointer ${
                        myRole === 'wolf'
                          ? 'bg-red-950/30 border-red-900/60 hover:border-red-500 text-white'
                          : myRole === 'doctor'
                          ? 'bg-emerald-950/30 border-emerald-900/60 hover:border-emerald-500 text-white'
                          : 'bg-blue-950/30 border-blue-900/60 hover:border-blue-500 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-xs text-neutral-300">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                        <span>{player.name}</span>
                      </div>

                      <span className="text-xs font-mono text-neutral-400 flex items-center gap-1">
                        <Crosshair className="w-3.5 h-3.5" /> Target
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* SLEEPING INTERFACE */
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-14 h-14 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500 animate-pulse">
                  <Moon className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold tracking-tight text-neutral-300">
                    Sleeping...
                  </h2>
                  <p className="text-xs text-neutral-500 max-w-xs">
                    It is not your turn yet. The village is asleep while other creatures roam the shadows.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-600">
                  YOUR ROLE: {myRole.toUpperCase()}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* CONCEALED STANDBY SCREEN (PITCH OLED BLACK) */
          <div className="flex flex-col items-center text-center gap-4 py-12">
            <div className="w-14 h-14 rounded-2xl bg-neutral-950 border border-neutral-900 flex items-center justify-center text-neutral-700">
              <Shield className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-neutral-400">
                Screen Concealed for Privacy
              </p>
              {actionConfirmed ? (
                <p className="text-xs font-mono text-emerald-400 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Action Confirmed
                </p>
              ) : (
                <p className="text-xs text-neutral-600 max-w-xs">
                  Tap 'Check Turn' below. The menu will reveal for 4 seconds before returning to black.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Check Turn Trigger Button */}
      <footer className="w-full max-w-md mx-auto pb-4">
        <button
          type="button"
          onClick={handleCheckTurn}
          disabled={isRevealed}
          className={`w-full h-15 rounded-2xl font-bold text-sm tracking-wide uppercase transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer select-none shadow-2xl ${
            isRevealed
              ? 'bg-neutral-900 text-neutral-400 border border-neutral-800 opacity-60 cursor-not-allowed'
              : 'bg-neutral-950 text-neutral-200 border border-neutral-800 hover:border-neutral-700 hover:text-white active:scale-[0.99]'
          }`}
        >
          {isRevealed ? (
            <>
              <Eye className="w-5 h-5 text-blue-400 animate-pulse" />
              <span>Turn Visible ({secondsRemaining}s)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-neutral-400" />
              <span>Check Turn</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
};
