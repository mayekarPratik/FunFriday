import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ROLE_PRIORITIES } from '../types/game';
import { Moon, Eye, Shield, Crosshair, Skull, Sparkles, HeartPulse } from 'lucide-react';

export const NightPhase: React.FC = () => {
  const { gameState, getMyPlayer } = useGameStore();
  const [isHolding, setIsHolding] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState(false);

  const me = getMyPlayer();

  if (!gameState || !me) {
    return (
      <div className="min-h-screen bg-black text-[#94A3B8] flex items-center justify-center p-6 text-center font-mono text-sm">
        Syncing player identity...
      </div>
    );
  }

  const myRole = me.role || 'villager';
  const myPriority = ROLE_PRIORITIES[myRole] ?? 0;
  const isMyTurn = myPriority > 0 && gameState.active_role_priority === myPriority;

  // Handlers for press-and-hold (Touch + Mouse)
  const startHold = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsHolding(true);
  };

  const endHold = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsHolding(false);
  };

  const otherAlivePlayers = gameState.players.filter(
    (p) => p.socket_id !== me.socket_id && p.is_alive
  );

  const handleSelectAction = (targetSocketId: string) => {
    setSelectedTarget(targetSocketId);
    setActionDone(true);
    useGameStore.getState().submitNightAction(targetSocketId);
  };

  return (
    <div
      className="min-h-screen w-full bg-black text-white flex flex-col justify-between p-4 sm:p-6 select-none touch-none"
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

      {/* Main Secret Content Area (Only visible when holding) */}
      <main className="flex-1 flex flex-col items-center justify-center my-auto py-6">
        {isHolding ? (
          <div className="w-full max-w-sm flex flex-col items-center text-center animate-fadeIn">
            {isMyTurn ? (
              /* ACTIVE TURN INTERFACE */
              <div className="w-full flex flex-col items-center gap-5">
                {/* Role Identity Tag */}
                <div className="flex flex-col items-center gap-2">
                  {myRole === 'wolf' && (
                    <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-500 shadow-lg shadow-red-950/50">
                      <Skull className="w-9 h-9" />
                    </div>
                  )}
                  {myRole === 'doctor' && (
                    <div className="w-16 h-16 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
                      <HeartPulse className="w-9 h-9" />
                    </div>
                  )}
                  {myRole === 'seer' && (
                    <div className="w-16 h-16 rounded-2xl bg-blue-950/40 border border-blue-800/60 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-950/50">
                      <Eye className="w-9 h-9" />
                    </div>
                  )}

                  <span className="px-3 py-0.5 rounded-full text-xs font-mono uppercase tracking-widest border border-white/10 bg-white/5 text-neutral-300">
                    YOUR ROLE: {myRole.toUpperCase()}
                  </span>

                  <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                    {myRole === 'wolf' && 'Choose Your Victim'}
                    {myRole === 'doctor' && 'Choose Who to Protect'}
                    {myRole === 'seer' && 'Inspect Alignment'}
                  </h2>
                  <p className="text-xs text-neutral-400 max-w-xs">
                    {myRole === 'wolf' && 'Select one villager to eliminate silently in the night.'}
                    {myRole === 'doctor' && 'Select one player to save from wolf attacks tonight.'}
                    {myRole === 'seer' && 'Choose a player to discover if they are a Werewolf.'}
                  </p>
                </div>

                {/* Role Specific Action Target Buttons */}
                <div className="w-full space-y-2 mt-2">
                  <div className="text-[11px] font-mono uppercase text-neutral-500 text-left px-1">
                    Select Target ({otherAlivePlayers.length} alive):
                  </div>

                  {otherAlivePlayers.map((player) => {
                    const isSelected = selectedTarget === player.socket_id;
                    return (
                      <button
                        key={player.socket_id}
                        onClick={() => handleSelectAction(player.socket_id)}
                        className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-sm font-medium transition cursor-pointer ${
                          isSelected
                            ? myRole === 'wolf'
                              ? 'bg-red-900/40 border-red-500 text-white shadow-lg'
                              : myRole === 'doctor'
                              ? 'bg-emerald-900/40 border-emerald-500 text-white shadow-lg'
                              : 'bg-blue-900/40 border-blue-500 text-white shadow-lg'
                            : 'bg-neutral-950 border-neutral-800/80 text-neutral-200 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-xs text-neutral-300">
                            {player.name.charAt(0).toUpperCase()}
                          </span>
                          <span>{player.name}</span>
                        </div>

                        {isSelected ? (
                          <span className="text-xs font-mono font-semibold flex items-center gap-1">
                            <Crosshair className="w-4 h-4" /> Selected
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-500 font-mono">
                            Target
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {actionDone && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-neutral-300 w-full">
                    ✓ Decision registered. Hold until night ends or release to conceal.
                  </div>
                )}
              </div>
            ) : (
              /* SLEEPING INTERFACE */
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500 animate-pulse">
                  <Moon className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight text-neutral-300">
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
            <div className="space-y-1">
              <p className="text-sm font-semibold text-neutral-400">
                Screen Concealed for Privacy
              </p>
              <p className="text-xs text-neutral-600 max-w-xs">
                Press and hold the button below to check your role and perform your turn.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Press and Hold Privacy Trigger */}
      <footer className="w-full max-w-md mx-auto pb-4">
        <button
          type="button"
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
          onTouchCancel={endHold}
          className={`w-full h-16 rounded-2xl font-bold text-sm tracking-wide uppercase transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer select-none shadow-2xl ${
            isHolding
              ? 'bg-neutral-800 text-white border-2 border-neutral-600 scale-[0.98]'
              : 'bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:text-white'
          }`}
        >
          {isHolding ? (
            <>
              <Eye className="w-5 h-5 text-[#3B82F6] animate-pulse" />
              <span>Viewing Turn (Release to Hide)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-neutral-500" />
              <span>Hold to check turn</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
};
