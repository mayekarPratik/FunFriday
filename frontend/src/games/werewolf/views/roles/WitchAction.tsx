import React, { useState, useEffect, useRef } from 'react';
import { useWerewolfStore } from '../../werewolfStore';
import { useCoreStore } from '../../../../store/coreStore';
import type { CoreStore } from '../../../../store/coreStore';
import { Moon, HeartPulse, Skull, Shield, Sparkles, CheckCircle2, Clock, FlaskConical } from 'lucide-react';

export const WitchAction: React.FC = () => {
  const { gameState, getMyPlayer, submitNightAction, settings } = useWerewolfStore();
  const socket = useCoreStore((s: CoreStore) => s.socket);

  // Base action time from settings with +2s extra for Witch's dual-potion menu
  const baseActionSeconds = gameState?.settings?.action_time_seconds || settings?.action_time_seconds || 6;
  const revealDurationMs = (baseActionSeconds + 2) * 1000;

  const [isRevealed, setIsRevealed] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(revealDurationMs);
  const [actionConfirmed, setActionConfirmed] = useState(false);

  // Local action states
  const [willHeal, setWillHeal] = useState(false);
  const [selectedPoisonId, setSelectedPoisonId] = useState<string | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Keep latest action selections accessible in timeout/zero callbacks
  const willHealRef = useRef(willHeal);
  const selectedPoisonIdRef = useRef(selectedPoisonId);
  const actionConfirmedRef = useRef(actionConfirmed);

  useEffect(() => {
    willHealRef.current = willHeal;
  }, [willHeal]);

  useEffect(() => {
    selectedPoisonIdRef.current = selectedPoisonId;
  }, [selectedPoisonId]);

  useEffect(() => {
    actionConfirmedRef.current = actionConfirmed;
  }, [actionConfirmed]);

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

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const me = getMyPlayer();

  if (!gameState || !me) {
    return (
      <div className="min-h-screen bg-black text-[#94A3B8] flex items-center justify-center p-6 text-center font-mono text-sm">
        Syncing player identity...
      </div>
    );
  }

  // Inventory status
  const witchRoleState = gameState.role_states?.witch;
  const hasHeal = witchRoleState ? Boolean(witchRoleState.has_heal) : true;
  const hasPoison = witchRoleState ? Boolean(witchRoleState.has_poison) : true;

  // Wolf victim info
  const wolfKillVictimId =
    gameState.night_actions?.wolf_kill ||
    gameState.night_actions?.['wolf']?.target_socket_id ||
    (typeof gameState.night_actions?.['wolf'] === 'string' ? gameState.night_actions?.['wolf'] : null);

  const wolfVictim = wolfKillVictimId
    ? gameState.players.find((p) => p.socket_id === wolfKillVictimId)
    : null;

  const wolfVictimName = wolfVictim ? wolfVictim.name : 'Nobody (No kill)';

  // Living players for poison grid (can include self or other alive players)
  const alivePlayers = gameState.players.filter((p) => p.is_alive);

  const performSubmission = (healChoice: boolean, poisonChoice: string | null) => {
    clearAllTimers();

    const healTarget = healChoice && wolfKillVictimId ? wolfKillVictimId : null;
    const poisonTarget = poisonChoice || null;

    const payload = {
      room_code: gameState.room_code,
      heal_target: healTarget,
      poison_target: poisonTarget
    };

    if (socket) {
      socket.emit('submit_action', payload);
      socket.emit('night_action', payload);
    } else {
      submitNightAction(payload);
    }

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
        if (!actionConfirmedRef.current) {
          performSubmission(willHealRef.current, selectedPoisonIdRef.current);
        } else {
          clearAllTimers();
          setIsRevealed(false);
        }
      }
    }, 50);

    timeoutRef.current = setTimeout(() => {
      if (!actionConfirmedRef.current) {
        performSubmission(willHealRef.current, selectedPoisonIdRef.current);
      } else {
        clearAllTimers();
        setIsRevealed(false);
      }
    }, revealDurationMs);
  };

  const handleConfirmActions = () => {
    performSubmission(willHeal, selectedPoisonId);
  };

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
          <span>NIGHT PHASE • WITCH's COVEN</span>
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
            <div className="w-full mb-5 p-3 rounded-xl bg-red-950/20 border border-red-900/40 flex flex-col gap-2">
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
            <div className="flex flex-col items-center gap-1.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-800/80 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-950/50">
                <FlaskConical className="w-6 h-6" />
              </div>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-widest border border-purple-500/30 bg-purple-950/40 text-purple-300">
                ROLE: WITCH
              </span>
            </div>

            {/* ACTION UI CONTAINER */}
            <div className="w-full flex flex-col gap-4">
              {/* TOP SECTION: HEAL POTION */}
              <div className="w-full p-4 rounded-2xl bg-[#0D0E15] border border-[#1F2430] flex flex-col gap-3 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-wider">
                    <HeartPulse className="w-4 h-4 text-emerald-400" />
                    <span>Healing Potion</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase ${
                      hasHeal
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                        : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                    }`}
                  >
                    {hasHeal ? 'Available' : 'Depleted'}
                  </span>
                </div>

                <div className="text-sm">
                  <span className="text-neutral-400">Night Casualty: </span>
                  <span className="font-bold text-red-400">
                    The Wolves attacked {wolfVictimName}
                  </span>
                </div>

                {hasHeal ? (
                  <button
                    type="button"
                    onClick={() => setWillHeal(!willHeal)}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer border active:scale-[0.98] ${
                      willHeal
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30'
                        : 'bg-emerald-950/30 border-emerald-900/60 hover:border-emerald-500 text-emerald-300'
                    }`}
                  >
                    <HeartPulse className="w-4 h-4" />
                    <span>{willHeal ? '✓ Potion Primed (Heal Them)' : 'Heal Them'}</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-500 text-center font-mono">
                    Healing potion already consumed in a previous night.
                  </div>
                )}
              </div>

              {/* MIDDLE SECTION: POISON POTION */}
              <div className="w-full p-4 rounded-2xl bg-[#0D0E15] border border-[#1F2430] flex flex-col gap-3 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-wider">
                    <Skull className="w-4 h-4 text-purple-400" />
                    <span>Poison Potion</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase ${
                      hasPoison
                        ? 'bg-purple-950/60 text-purple-400 border border-purple-800/60'
                        : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                    }`}
                  >
                    {hasPoison ? 'Available' : 'Depleted'}
                  </span>
                </div>

                {hasPoison ? (
                  <>
                    <p className="text-xs text-neutral-400">
                      Tap a player below to poison them tonight:
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      {alivePlayers.map((player) => {
                        const isSelected = selectedPoisonId === player.socket_id;
                        return (
                          <button
                            key={player.socket_id}
                            type="button"
                            onClick={() => {
                              setSelectedPoisonId(isSelected ? null : player.socket_id);
                            }}
                            className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition cursor-pointer active:scale-95 ${
                              isSelected
                                ? 'bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-600/30'
                                : 'bg-purple-950/20 border-purple-900/40 hover:border-purple-600 text-neutral-200'
                            }`}
                          >
                            <span className="truncate">{player.name}</span>
                            {isSelected && <Skull className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-500 text-center font-mono">
                    Poison potion already consumed in a previous night.
                  </div>
                )}
              </div>

              {/* BOTTOM SECTION: SUBMIT BUTTON */}
              <button
                type="button"
                onClick={handleConfirmActions}
                className="w-full h-12 mt-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide uppercase transition shadow-lg shadow-purple-600/25 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4.5 h-4.5" />
                <span>Confirm Actions</span>
              </button>
            </div>
          </div>
        ) : (
          /* CONCEALED STANDBY SCREEN */
          <div className="flex flex-col items-center text-center gap-4 py-12">
            <div className="w-14 h-14 rounded-2xl bg-neutral-950 border border-neutral-900 flex items-center justify-center text-neutral-700">
              <Shield className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-neutral-400">
                Screen Concealed for Privacy
              </p>
              {actionConfirmed ? (
                <p className="text-xs font-mono text-purple-400 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Potions Stowed
                </p>
              ) : (
                <p className="text-xs text-neutral-600 max-w-xs">
                  Tap 'Check Turn' below. The menu will reveal for action duration before returning to black.
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
              <FlaskConical className="w-5 h-5 text-purple-400 animate-pulse" />
              <span>Turn Visible ({secondsRemaining}s)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Check Turn</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
};

export default WitchAction;
