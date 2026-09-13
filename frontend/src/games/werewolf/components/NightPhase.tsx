import React, { useState, useEffect, useRef } from 'react';
import { useWerewolfStore } from '../werewolfStore';
import { useCoreStore } from '../../../store/coreStore';
import { ROLE_PRIORITIES } from '../../../types/game';
import type { CoreStore } from '../../../store/coreStore';
import {
  Moon,
  Eye,
  Shield,
  Crosshair,
  Skull,
  Sparkles,
  HeartPulse,
  CheckCircle2,
  Clock,
  Heart
} from 'lucide-react';
import { WitchAction } from '../views/roles/WitchAction';

export const NightPhase: React.FC = () => {
  const { gameState, getMyPlayer, submitNightAction, investigatePlayer, settings } = useWerewolfStore();
  const socket = useCoreStore((s: CoreStore) => s.socket);

  const me = getMyPlayer();
  const myRole = me?.role || 'villager';

  // Dynamic action time from Zustand store / GameState settings
  const baseActionSeconds = gameState?.settings?.action_time_seconds || settings?.action_time_seconds || 6;
  // Dual-choice roles (Cupid) get safely +2s for multi-tap selection
  const roleExtraSeconds = myRole === 'cupid' ? 2 : 0;
  const revealDurationMs = (baseActionSeconds + roleExtraSeconds) * 1000;

  const [isRevealed, setIsRevealed] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(revealDurationMs);
  const [actionConfirmed, setActionConfirmed] = useState(false);

  // Seer investigation result state: { target_name: string; is_wolf: boolean }
  const [seerResult, setSeerResult] = useState<{ target_name: string; is_wolf: boolean } | null>(null);
  const [isInvestigating, setIsInvestigating] = useState(false);

  // Cupid multi-select state
  const [selectedCupidTargets, setSelectedCupidTargets] = useState<string[]>([]);

  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const autoAdvanceTimeoutRef = useRef<number | null>(null);

  // If eliminated, render Spectator Mode
  if (me && !me.is_alive) {
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
      </div>
    );
  }

  // Clear all running timers on unmount or reset
  const clearAllTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  // When active role turn changes, re-arm the secret button
  const currentActiveRole = gameState?.active_role;
  useEffect(() => {
    clearAllTimers();
    setIsRevealed(false);
    setActionConfirmed(false);
    setTimeLeftMs(revealDurationMs);
    setSeerResult(null);
    setIsInvestigating(false);
    setSelectedCupidTargets([]);
  }, [currentActiveRole, revealDurationMs]);

  if (!gameState || !me) {
    return (
      <div className="min-h-screen bg-black text-[#94A3B8] flex items-center justify-center p-6 text-center font-mono text-sm">
        Syncing player identity...
      </div>
    );
  }

  // Check if it is currently this player's turn to act
  const myPriority = ROLE_PRIORITIES[myRole] ?? 99;
  const isMyRoleTurn =
    gameState.active_role === myRole ||
    (myRole === 'werewolf' && gameState.active_role === 'wolf') ||
    (myRole === 'wolf' && gameState.active_role === 'werewolf') ||
    gameState.active_role_priority === myPriority;

  // Filter valid targets (living players)
  const alivePlayers = gameState.players.filter((p) => p.is_alive);
  const otherAlivePlayers = alivePlayers.filter((p) => p.socket_id !== me.socket_id);

  // Auto-lock in whatever action is in progress when timer hits 0
  const handleAutoLockIn = () => {
    clearAllTimers();
    setIsRevealed(false);
    setActionConfirmed(true);
    setTimeLeftMs(revealDurationMs);
  };

  const handleCheckTurn = () => {
    if (isRevealed || actionConfirmed) return;

    clearAllTimers();
    setIsRevealed(true);
    setTimeLeftMs(revealDurationMs);

    const startTime = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, revealDurationMs - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        handleAutoLockIn();
      }
    }, 50);

    timeoutRef.current = setTimeout(() => {
      handleAutoLockIn();
    }, revealDurationMs);
  };

  const handlePerformAction = (targetSocketId: string) => {
    submitNightAction(targetSocketId);
    clearAllTimers();
    setIsRevealed(false);
    setActionConfirmed(true);
    setTimeLeftMs(revealDurationMs);
  };

  // Seer investigation handler
  const handleInspectPlayer = async (targetSocketId: string) => {
    setIsInvestigating(true);
    const result = await investigatePlayer(targetSocketId);
    setIsInvestigating(false);

    const targetPlayer = gameState.players.find((p) => p.socket_id === targetSocketId);
    const targetName = targetPlayer?.name || 'Unknown';

    if (result.success) {
      setSeerResult({
        target_name: targetName,
        is_wolf: Boolean(result.is_wolf)
      });
    }

    autoAdvanceTimeoutRef.current = setTimeout(() => {
      handleAutoLockIn();
    }, 3000);
  };

  // Cupid toggle target
  const handleToggleCupidTarget = (socketId: string) => {
    setSelectedCupidTargets((prev) => {
      if (prev.includes(socketId)) {
        return prev.filter((id) => id !== socketId);
      }
      if (prev.length < 2) {
        return [...prev, socketId];
      }
      return [prev[1], socketId];
    });
  };

  const handleConfirmLovers = () => {
    if (selectedCupidTargets.length === 2) {
      if (socket) {
        socket.emit('cupid_link_lovers', {
          room_code: gameState.room_code,
          lovers: selectedCupidTargets
        });
      }
      clearAllTimers();
      setIsRevealed(false);
      setActionConfirmed(true);
      setTimeLeftMs(revealDurationMs);
    }
  };

  // Specialized Witch view
  if (myRole === 'witch' && isMyRoleTurn) {
    return <WitchAction />;
  }

  const secondsRemaining = Math.ceil(timeLeftMs / 1000);
  const progressPercent = Math.max(0, Math.min(100, (timeLeftMs / revealDurationMs) * 100));

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
      <main className="flex-1 flex flex-col items-center justify-center my-auto py-4">
        {isRevealed ? (
          <div className="w-full max-w-md flex flex-col items-center text-center animate-fadeIn">
            {/* Fast-Shrinking Red Progress Bar */}
            <div className="w-full mb-6 p-3 rounded-xl bg-red-950/20 border border-red-900/40 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-red-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-red-500 animate-spin" /> Decisions auto-lock in:
                </span>
                <span className="font-bold text-red-400 text-sm">
                  {secondsRemaining}s
                </span>
              </div>
              <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 transition-all duration-75 ease-linear rounded-full shadow-[0_0_8px_rgba(220,38,38,0.8)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Role Header */}
            <div className="flex flex-col items-center gap-2 mb-6">
              <span className="px-3.5 py-1 rounded-full text-xs font-mono uppercase tracking-widest border border-white/10 bg-white/5 text-neutral-300">
                ROLE: {myRole.replace('_', ' ')}
              </span>
            </div>

            {/* ACTION UI BY ROLE */}
            {isMyRoleTurn ? (
              <div className="w-full flex flex-col gap-4">
                {/* 1. WEREWOLF */}
                {(myRole === 'werewolf' || myRole === 'wolf') && (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400 shadow-lg shadow-red-950/50 mb-1">
                        <Skull className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-red-400">Choose Victim to Devour</h3>
                      <p className="text-xs text-neutral-400">
                        Tap a villager below to eliminate them tonight.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {otherAlivePlayers.map((player) => (
                        <button
                          key={player.socket_id}
                          type="button"
                          onClick={() => handlePerformAction(player.socket_id)}
                          className="p-3.5 rounded-2xl bg-[#0D0E15] hover:bg-red-950/40 border border-[#1F2430] hover:border-red-600 font-semibold text-xs text-neutral-200 hover:text-white flex items-center justify-between transition cursor-pointer active:scale-95 shadow-lg"
                        >
                          <span className="truncate">{player.name}</span>
                          <Crosshair className="w-4 h-4 text-red-500 shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. DOCTOR */}
                {myRole === 'doctor' && (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50 mb-1">
                        <HeartPulse className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-emerald-400">Choose Player to Protect</h3>
                      <p className="text-xs text-neutral-400">
                        They will survive wolf attacks tonight.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {alivePlayers.map((player) => (
                        <button
                          key={player.socket_id}
                          type="button"
                          onClick={() => handlePerformAction(player.socket_id)}
                          className="p-3.5 rounded-2xl bg-[#0D0E15] hover:bg-emerald-950/40 border border-[#1F2430] hover:border-emerald-500 font-semibold text-xs text-neutral-200 hover:text-white flex items-center justify-between transition cursor-pointer active:scale-95 shadow-lg"
                        >
                          <span className="truncate">
                            {player.name} {player.socket_id === me.socket_id && '(You)'}
                          </span>
                          <Shield className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. SEER */}
                {myRole === 'seer' && (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50 mb-1">
                        <Eye className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-cyan-400">Peer into Player's Soul</h3>
                      <p className="text-xs text-neutral-400">
                        Reveal whether they are aligned with Werewolves.
                      </p>
                    </div>

                    {seerResult ? (
                      <div
                        className={`p-6 rounded-2xl border flex flex-col items-center gap-3 animate-fadeIn ${
                          seerResult.is_wolf
                            ? 'bg-red-950/50 border-red-700/80 text-red-300'
                            : 'bg-cyan-950/50 border-cyan-700/80 text-cyan-300'
                        }`}
                      >
                        {seerResult.is_wolf ? (
                          <Skull className="w-12 h-12 text-red-500 animate-bounce" />
                        ) : (
                          <Shield className="w-12 h-12 text-cyan-400 animate-pulse" />
                        )}
                        <h4 className="text-xl font-bold">{seerResult.target_name}</h4>
                        <span className="text-sm font-mono uppercase tracking-wider font-bold">
                          {seerResult.is_wolf ? '🐺 WEREWOLF DETECTED' : '🛡️ VILLAGER / NOT A WOLF'}
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        {otherAlivePlayers.map((player) => (
                          <button
                            key={player.socket_id}
                            type="button"
                            disabled={isInvestigating}
                            onClick={() => handleInspectPlayer(player.socket_id)}
                            className="p-3.5 rounded-2xl bg-[#0D0E15] hover:bg-cyan-950/40 border border-[#1F2430] hover:border-cyan-500 font-semibold text-xs text-neutral-200 hover:text-white flex items-center justify-between transition cursor-pointer active:scale-95 shadow-lg"
                          >
                            <span className="truncate">{player.name}</span>
                            <Eye className="w-4 h-4 text-cyan-400 shrink-0 ml-1" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. CUPID */}
                {myRole === 'cupid' && (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-pink-950/60 border border-pink-800/80 flex items-center justify-center text-pink-400 shadow-lg shadow-pink-950/50 mb-1">
                        <Heart className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-pink-400">Bind Two Soulmates</h3>
                      <p className="text-xs text-neutral-400">
                        Select 2 players. If one dies, the other dies of heartbreak.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {alivePlayers.map((player) => {
                        const isSelected = selectedCupidTargets.includes(player.socket_id);
                        return (
                          <button
                            key={player.socket_id}
                            type="button"
                            onClick={() => handleToggleCupidTarget(player.socket_id)}
                            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer active:scale-95 shadow-lg ${
                              isSelected
                                ? 'bg-pink-600 border-pink-400 text-white shadow-pink-600/30'
                                : 'bg-[#0D0E15] border-[#1F2430] hover:border-pink-500 text-neutral-200'
                            }`}
                          >
                            <span className="truncate">{player.name}</span>
                            {isSelected ? (
                              <Heart className="w-4 h-4 fill-white text-white shrink-0 ml-1" />
                            ) : (
                              <Heart className="w-4 h-4 text-neutral-500 shrink-0 ml-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={selectedCupidTargets.length !== 2}
                      onClick={handleConfirmLovers}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition shadow-lg cursor-pointer"
                    >
                      Bind {selectedCupidTargets.length}/2 Lovers
                    </button>
                  </div>
                )}

                {/* 5. SHERIFF */}
                {myRole === 'sheriff' && (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-800/80 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/50 mb-1">
                        <Crosshair className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-amber-400">Sheriff's Silver Bullet</h3>
                      <p className="text-xs text-neutral-400">
                        Fire your single silver bullet or pass tonight.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {otherAlivePlayers.map((player) => (
                        <button
                          key={player.socket_id}
                          type="button"
                          onClick={() => handlePerformAction(player.socket_id)}
                          className="p-3.5 rounded-2xl bg-[#0D0E15] hover:bg-amber-950/40 border border-[#1F2430] hover:border-amber-500 font-semibold text-xs text-neutral-200 hover:text-white flex items-center justify-between transition cursor-pointer active:scale-95 shadow-lg"
                        >
                          <span className="truncate">{player.name}</span>
                          <Crosshair className="w-4 h-4 text-amber-400 shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* NOT CURRENTLY THIS ROLE'S TURN */
              <div className="p-6 rounded-2xl bg-[#0D0E15] border border-[#1F2430] text-center space-y-3 shadow-xl">
                <Moon className="w-8 h-8 text-neutral-500 mx-auto animate-pulse" />
                <h4 className="text-sm font-semibold text-neutral-300">
                  Not your turn to act right now.
                </h4>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  Keep eyes closed. Your turn will arrive shortly or you will awaken at dawn.
                </p>
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
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Night Action Stowed
                </p>
              ) : (
                <p className="text-xs text-neutral-600 max-w-xs">
                  Tap 'Check Turn' below. The screen will reveal for action duration before returning to black.
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
              <Moon className="w-5 h-5 text-neutral-400 animate-pulse" />
              <span>Turn Visible ({secondsRemaining}s)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-[#3B82F6]" />
              <span>Check Turn</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
};

export default NightPhase;
