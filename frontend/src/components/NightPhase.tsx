import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { ROLE_PRIORITIES } from '../types/game';
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
  Heart,
  AlertCircle
} from 'lucide-react';
import { WitchAction } from '../views/roles/WitchAction';

export const NightPhase: React.FC = () => {
  const { gameState, getMyPlayer, submitNightAction, investigatePlayer, socket, settings } = useGameStore();

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

  // Seer investigation result state: { target_name: string; is_wolf: boolean; target_socket_id: string }
  const [seerResult, setSeerResult] = useState<{
    target_name: string;
    is_wolf: boolean;
    target_socket_id: string;
  } | null>(null);
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

  // Reset local state when active role or phase changes
  useEffect(() => {
    setIsRevealed(false);
    setActionConfirmed(false);
    setSeerResult(null);
    setIsInvestigating(false);
    setSelectedCupidTargets([]);
    setTimeLeftMs(revealDurationMs);
    clearAllTimers();
  }, [gameState?.active_role, gameState?.phase, revealDurationMs]);

  // Listen for socket 'seer_result' if triggered externally
  useEffect(() => {
    if (!socket) return;
    const handleSeerResult = (data: { target_name?: string; is_wolf: boolean; target_socket_id: string }) => {
      const targetName =
        data.target_name ||
        gameState?.players.find((p) => p.socket_id === data.target_socket_id)?.name ||
        'Target';
      setSeerResult({
        target_name: targetName,
        is_wolf: data.is_wolf,
        target_socket_id: data.target_socket_id
      });
      setIsInvestigating(false);
    };

    socket.on('seer_result', handleSeerResult);
    return () => {
      socket.off('seer_result', handleSeerResult);
    };
  }, [socket, gameState?.players, submitNightAction]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const hideScreen = () => {
    clearAllTimers();
    setIsRevealed(false);
    setTimeLeftMs(revealDurationMs);
  };

  const handleCheckTurn = () => {
    if (isRevealed || actionConfirmed) return;

    clearAllTimers();
    setIsRevealed(true);
    setTimeLeftMs(revealDurationMs);

    const startTime = Date.now();

    // 50ms interval for smooth progress bar and countdown
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, revealDurationMs - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        hideScreen();
      }
    }, 50);

    // Hard timeout
    timeoutRef.current = setTimeout(() => {
      hideScreen();
    }, revealDurationMs);
  };

  const handleSelectTarget = async (targetSocketId: string) => {
    if (!myRole) return;

    if (myRole === 'seer') {
      setIsInvestigating(true);
      clearAllTimers();

      const res = await investigatePlayer(targetSocketId);
      if (res?.success) {
        const targetPlayer = gameState?.players.find((p) => p.socket_id === targetSocketId);
        setSeerResult({
          target_name: targetPlayer ? targetPlayer.name : 'Target',
          is_wolf: Boolean(res.is_wolf),
          target_socket_id: targetSocketId
        });
        setIsInvestigating(false);
      } else {
        // Fallback submit
        submitNightAction(targetSocketId);
        setIsRevealed(false);
        setActionConfirmed(true);
        setIsInvestigating(false);
      }
      return;
    }

    // Single target action (Wolf, Doctor, etc.)
    clearAllTimers();
    submitNightAction(targetSocketId);
    setIsRevealed(false);
    setActionConfirmed(true);
    setTimeLeftMs(revealDurationMs);
  };

  const handleFinishSeerTurn = (targetSocketId: string) => {
    submitNightAction(targetSocketId);
    clearAllTimers();
    setIsRevealed(false);
    setActionConfirmed(true);
    setTimeLeftMs(revealDurationMs);
  };

  const handleCupidSelect = (targetSocketId: string) => {
    let nextTargets = [...selectedCupidTargets];
    if (nextTargets.includes(targetSocketId)) {
      nextTargets = nextTargets.filter((id) => id !== targetSocketId);
    } else {
      if (nextTargets.length < 2) {
        nextTargets.push(targetSocketId);
      }
    }
    setSelectedCupidTargets(nextTargets);
  };

  const handleConfirmCupid = () => {
    if (selectedCupidTargets.length !== 2) return;
    clearAllTimers();
    submitNightAction({
      action_type: 'link',
      target_socket_ids: selectedCupidTargets
    });
    setIsRevealed(false);
    setActionConfirmed(true);
    setTimeLeftMs(revealDurationMs);
  };

  if (!gameState || !me) {
    return (
      <div className="min-h-screen bg-black text-[#94A3B8] flex items-center justify-center p-6 text-center font-mono text-sm">
        Syncing player identity...
      </div>
    );
  }

  const myPriority = ROLE_PRIORITIES[myRole] ?? 0;
  const sheriffBulletCount = myRole === 'sheriff'
    ? (gameState?.role_states?.sheriff?.bullet_count ?? (gameState?.role_states?.sheriff?.has_bullet ? 1 : 0))
    : 0;
  const hasSheriffBullet = myRole === 'sheriff' ? sheriffBulletCount > 0 : true;
  const isMyTurn =
    ((gameState.active_role && gameState.active_role === myRole) ||
    (myPriority > 0 && gameState.active_role_priority === myPriority)) &&
    (myRole !== 'sheriff' || hasSheriffBullet);

  const handleSkipSheriffTurn = () => {
    clearAllTimers();
    submitNightAction({ action_type: 'kill', target_socket_id: '' });
    setIsRevealed(false);
    setActionConfirmed(true);
    setTimeLeftMs(revealDurationMs);
  };

  // If local player is the Witch and it is the Witch's active turn, render WitchAction
  if (myRole === 'witch' && (gameState.active_role === 'witch' || isMyTurn)) {
    return <WitchAction />;
  }

  const otherAlivePlayers = gameState.players.filter(
    (p) => p.socket_id !== me.socket_id && p.is_alive
  );

  const secondsRemaining = Math.ceil(timeLeftMs / 1000);
  const progressPercent = Math.max(0, Math.min(100, (timeLeftMs / revealDurationMs) * 100));

  return (
    <div
      className="flex-1 w-full h-full bg-black text-white flex flex-col justify-between p-3 sm:p-6 select-none touch-manipulation overflow-hidden box-border"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Discreet Header */}
      <header className="shrink-0 flex items-center justify-between py-2 border-b border-white/5 opacity-40">
        <div className="flex items-center gap-2 font-mono text-xs text-neutral-400">
          <Moon className="w-3.5 h-3.5" />
          <span>NIGHT PHASE</span>
        </div>
        <div className="font-mono text-xs text-neutral-500">
          ROOM: {gameState.room_code}
        </div>
      </header>

      {/* Main Secret Content Area */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center my-auto py-2 sm:py-4 overflow-hidden">
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
                  {myRole === 'cupid' && (
                    <div className="w-14 h-14 rounded-2xl bg-pink-950/50 border border-pink-800/80 flex items-center justify-center text-pink-400 shadow-lg shadow-pink-950/50">
                      <Heart className="w-8 h-8" />
                    </div>
                  )}
                  {myRole === 'sheriff' && (
                    <div className="w-14 h-14 rounded-2xl bg-blue-950/50 border border-blue-800/80 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-950/50">
                      <Shield className="w-8 h-8" />
                    </div>
                  )}

                  <span className="px-3 py-0.5 rounded-full text-xs font-mono uppercase tracking-widest border border-white/10 bg-white/5 text-neutral-300">
                    YOUR ROLE: {myRole.toUpperCase()}
                  </span>

                  <h2 className="text-xl font-bold tracking-tight text-white mt-1">
                    {myRole === 'wolf' && 'Choose Your Victim'}
                    {myRole === 'doctor' && 'Choose Who to Protect'}
                    {myRole === 'seer' && 'Inspect Alignment'}
                    {myRole === 'cupid' && 'Link Two Secret Lovers'}
                    {myRole === 'sheriff' && 'Fire Silver Bullet'}
                  </h2>
                </div>

                {/* Seer Inspection Result Card */}
                {myRole === 'seer' && seerResult && (
                  <div className="w-full space-y-3 animate-fadeIn">
                    <div
                      className={`w-full p-4 rounded-xl border flex flex-col items-center gap-2 ${
                        seerResult.is_wolf
                          ? 'bg-red-950/40 border-red-800/80 text-red-400'
                          : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {seerResult.is_wolf ? (
                          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        )}
                        <span>
                          {seerResult.target_name} is{' '}
                          {seerResult.is_wolf ? 'a Werewolf! 🐺' : 'NOT a Werewolf (Innocent) 🛡️'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFinishSeerTurn(seerResult.target_socket_id)}
                      className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-xs uppercase tracking-wider text-white transition cursor-pointer shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Done</span>
                    </button>
                  </div>
                )}

                {/* Cupid Instructions and Confirm Button */}
                {myRole === 'cupid' && (
                  <div className="w-full space-y-2">
                    <p className="text-xs text-neutral-400 text-left">
                      Select 2 players to bind as lovers ({selectedCupidTargets.length}/2):
                    </p>
                    {selectedCupidTargets.length === 2 && (
                      <button
                        onClick={handleConfirmCupid}
                        className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 font-bold text-xs uppercase tracking-wider text-white transition cursor-pointer shadow-lg shadow-pink-600/30"
                      >
                        Confirm Lovers Link
                      </button>
                    )}
                  </div>
                )}

                {/* Sheriff Bullet Information & Skip Turn Button */}
                {myRole === 'sheriff' && (
                  <div className="w-full space-y-3">
                    <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/50 text-left space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400 uppercase font-mono tracking-wide">
                          Bullets Remaining: {sheriffBulletCount}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {sheriffBulletCount} {sheriffBulletCount === 1 ? 'shot' : 'shots'} left
                        </span>
                      </div>
                      <p className="text-xs text-blue-300 leading-relaxed">
                        Shoot a suspect tonight or save your ammunition for a future night.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSkipSheriffTurn}
                      className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 font-mono text-xs uppercase tracking-wider text-neutral-300 transition cursor-pointer"
                    >
                      Skip Turn (Save Bullet)
                    </button>
                  </div>
                )}

                {/* Role Specific Action Target Buttons */}
                {(!seerResult || myRole !== 'seer') && (
                  <div className="w-full space-y-2 mt-2">
                    <div className="text-[11px] font-mono uppercase text-neutral-500 text-left px-1 flex items-center justify-between">
                      <span>
                        {myRole === 'cupid'
                          ? 'Tap 2 players to select:'
                          : myRole === 'sheriff'
                          ? 'Tap to shoot suspect:'
                          : 'Tap to submit action:'}
                      </span>
                      {myRole === 'sheriff' && (
                        <span className="text-blue-400 font-bold font-mono">
                          Bullets: {sheriffBulletCount}
                        </span>
                      )}
                    </div>

                    {otherAlivePlayers.map((player) => {
                      const isCupidSelected = selectedCupidTargets.includes(player.socket_id);

                      return (
                        <button
                          key={player.socket_id}
                          disabled={isInvestigating}
                          onClick={() => {
                            if (myRole === 'cupid') {
                              handleCupidSelect(player.socket_id);
                            } else {
                              handleSelectTarget(player.socket_id);
                            }
                          }}
                          className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-sm font-medium transition active:scale-[0.98] cursor-pointer ${
                            myRole === 'cupid' && isCupidSelected
                              ? 'bg-pink-950/60 border-pink-500 text-white shadow-md'
                              : myRole === 'wolf'
                              ? 'bg-red-950/30 border-red-900/60 hover:border-red-500 text-white'
                              : myRole === 'doctor'
                              ? 'bg-emerald-950/30 border-emerald-900/60 hover:border-emerald-500 text-white'
                              : myRole === 'cupid'
                              ? 'bg-pink-950/20 border-pink-950 hover:border-pink-500 text-white'
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
                            {myRole === 'cupid' ? (
                              isCupidSelected ? (
                                <span className="text-pink-400 font-bold">Selected</span>
                              ) : (
                                <span>Select</span>
                              )
                            ) : myRole === 'sheriff' ? (
                              <>
                                <Crosshair className="w-3.5 h-3.5 text-blue-400" /> Shoot
                              </>
                            ) : (
                              <>
                                <Crosshair className="w-3.5 h-3.5" /> Target
                              </>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* SLEEPING INTERFACE FOR PASSIVE / INACTIVE ROLES */
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-14 h-14 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500 animate-pulse">
                  <Moon className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold tracking-tight text-neutral-300">
                    {myRole === 'villager'
                      ? 'The Village Sleeps'
                      : myRole === 'jester'
                      ? 'Plotting Trickery...'
                      : myRole === 'executioner'
                      ? 'Awaiting Day Trial...'
                      : myRole === 'sheriff' && !hasSheriffBullet
                      ? 'Out of Ammo'
                      : 'Sleeping...'}
                  </h2>
                  <p className="text-xs text-neutral-500 max-w-xs">
                    {myRole === 'villager'
                      ? 'You are a Villager. Sleep peacefully tonight and prepare for the daytime trial.'
                      : myRole === 'jester'
                      ? 'You are the Jester. You have no night action. Try to get yourself voted out by day!'
                      : myRole === 'executioner'
                      ? 'You are the Executioner. Wait for daytime to accuse your target!'
                      : myRole === 'sheriff' && !hasSheriffBullet
                      ? 'You have depleted all of your silver bullets. Sleep peacefully through the night.'
                      : 'It is not your turn yet. The village is asleep while other creatures roam the shadows.'}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-500">
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
              ) : myRole === 'seer' && seerResult ? (
                <p className="text-xs text-cyan-400 max-w-xs">
                  Identity revealed. Tap 'Check Selected Option / Done' below to review and advance.
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
          disabled={isRevealed || actionConfirmed}
          className={`w-full h-15 rounded-2xl font-bold text-sm tracking-wide uppercase transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer select-none shadow-2xl ${
            isRevealed || actionConfirmed
              ? 'bg-neutral-900 text-neutral-400 border border-neutral-800 opacity-60 cursor-not-allowed'
              : 'bg-neutral-950 text-neutral-200 border border-neutral-800 hover:border-neutral-700 hover:text-white active:scale-[0.99]'
          }`}
        >
          {isRevealed ? (
            <>
              <Eye className="w-5 h-5 text-blue-400 animate-pulse" />
              <span>Turn Visible ({secondsRemaining}s)</span>
            </>
          ) : actionConfirmed ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Action Submitted</span>
            </>
          ) : myRole === 'seer' && seerResult ? (
            <>
              <Eye className="w-5 h-5 text-cyan-400" />
              <span>Check Selected Option / Done</span>
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
