import React from 'react';
import { useMafiaStore } from './mafiaStore';
import { useCoreStore } from '../../store/coreStore';
import { InteractiveBackground } from '../../components/InteractiveBackground';
import {
  Users,
  Shield,
  Clock,
  Skull,
  Award,
  Play,
  Flame,
  Moon,
  Sun,
  AlertCircle
} from 'lucide-react';

export const MafiaHost: React.FC = () => {
  const {
    phase,
    players: mafiaPlayers,
    timeLeft,
    nightEvents,
    recentElimination,
    winner,
    votes,
    lastActionError,
    startMafiaGame,
    hostAdvancePhase,
    hostRestartGame
  } = useMafiaStore();

  const { roomCode, players: corePlayers } = useCoreStore();

  const activePlayers = mafiaPlayers.length > 0 ? mafiaPlayers : (corePlayers as any[]);
  const livingPlayers = activePlayers.filter((p) => p.is_alive !== false);
  const eliminatedPlayers = activePlayers.filter((p) => p.is_alive === false);

  // 1. Cinematic 8-second VOTING REVEAL Screen
  if (phase === 'VOTING_REVEAL') {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-between p-8 sm:p-12 z-50 select-none animate-fadeIn">
        <InteractiveBackground isLandingPage={false} />

        {/* Top Phase Header */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/60 border border-red-800/80 text-red-400 text-xs font-mono uppercase tracking-widest mt-4 backdrop-blur-md">
          <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span>Verdict of The Lobby</span>
        </div>

        {/* Central Cinematic Verdict */}
        <div className="max-w-4xl text-center px-4 space-y-6 my-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-gray-200 tracking-wide font-light">
            The village has spoken...
          </h1>

          {recentElimination ? (
            <div className="space-y-6 animate-bounce-short">
              <p className="text-xl sm:text-2xl md:text-3xl font-serif text-red-400 font-light">
                <span className="font-bold text-white uppercase tracking-wider">{recentElimination.name}</span> was voted out.
              </p>

              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-red-950/80 border border-red-700 text-red-300 font-mono text-lg uppercase tracking-widest shadow-2xl shadow-red-950/80">
                <Skull className="w-6 h-6 text-red-500" />
                <span>Their secret role was: <strong className="text-white">{recentElimination.role?.toUpperCase()}</strong></span>
              </div>
            </div>
          ) : (
            <p className="text-2xl sm:text-3xl md:text-4xl font-serif text-blue-400 tracking-wide font-light">
              ...The votes were tied! No one was executed today.
            </p>
          )}

          <p className="text-sm font-mono text-[#94A3B8] tracking-widest uppercase animate-pulse pt-4">
            Night falls in a few moments...
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="w-full flex items-center justify-between text-xs font-mono text-[#94A3B8] border-t border-[#1F2430]/60 pt-4">
          <span>Room: {roomCode}</span>
          <span>Phase Timer: {timeLeft}s</span>
        </div>
      </div>
    );
  }

  // 2. Cinematic GAME OVER Screen
  if (phase === 'GAME_OVER') {
    const isTownWin = winner === 'town';
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-between p-8 sm:p-12 z-50 select-none animate-fadeIn">
        <InteractiveBackground isLandingPage={false} />

        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#12141C] border border-[#1F2430] text-xs font-mono uppercase tracking-widest mt-4">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Game Finished</span>
        </div>

        <div className="max-w-3xl text-center space-y-6 my-auto">
          <div className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center border shadow-2xl ${
            isTownWin
              ? 'bg-blue-950/50 border-blue-600 text-blue-400 shadow-blue-950/80'
              : 'bg-red-950/50 border-red-600 text-red-400 shadow-red-950/80'
          }`}>
            {isTownWin ? <Shield className="w-12 h-12" /> : <Skull className="w-12 h-12" />}
          </div>

          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-wider text-white">
            {isTownWin ? 'Townspeople Victorious!' : 'The Mafia Takes Over!'}
          </h1>

          <p className="text-base sm:text-lg text-[#94A3B8] font-serif max-w-xl mx-auto">
            {isTownWin
              ? 'All Mafia syndicate members have been rooted out and brought to justice!'
              : 'The Mafia syndicate has gained numerical dominance over the town.'}
          </p>

          <div className="pt-4 flex justify-center">
            <button
              onClick={hostRestartGame}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] font-bold text-white shadow-xl shadow-[#3B82F6]/30 cursor-pointer active:scale-95 transition"
            >
              Return to The Lobby
            </button>
          </div>
        </div>

        <div className="w-full text-center text-xs text-[#64748B] font-mono">
          The Lobby • Mafia Undercover
        </div>
      </div>
    );
  }

  // 3. Main Host Dashboard: Grid of Frosted Glass Player Cards
  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-6 py-4 px-4 min-h-screen">
      <InteractiveBackground isLandingPage={false} />

      {/* Top Banner */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-[#12141C]/80 border border-[#1F2430] shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#191C28] border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-lg">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                Mafia Host Screen
              </span>
              <span className="text-xs font-mono text-[#94A3B8]">
                Room: <strong className="text-white tracking-widest">{roomCode}</strong>
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-0.5">
              {phase === 'LOBBY' && 'Pre-Game Lounge'}
              {phase === 'ROLE_REVEAL' && 'Secret Roles Being Assigned...'}
              {phase === 'NIGHT' && 'Night Phase — Eyes Closed'}
              {phase === 'DAY' && 'Day Phase — Open Discussion & Voting'}
            </h1>
          </div>
        </div>

        {/* Phase Badge & Timer */}
        <div className="flex items-center gap-3">
          {phase !== 'LOBBY' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#090A0F] border border-[#1F2430] text-sm font-mono text-[#94A3B8]">
              {phase === 'NIGHT' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <span>Phase: <strong className="text-white uppercase">{phase}</strong></span>
              {timeLeft > 0 && (
                <span className="text-amber-400 ml-2 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {timeLeft}s
                </span>
              )}
            </div>
          )}

          {phase === 'LOBBY' ? (
            <button
              onClick={startMafiaGame}
              disabled={activePlayers.length < 3}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-white shadow-lg shadow-amber-600/30 transition cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Mafia ({activePlayers.length}/3+ Min)</span>
            </button>
          ) : (
            <button
              onClick={hostAdvancePhase}
              className="px-4 py-2 rounded-xl bg-[#191C28] hover:bg-[#252A3D] border border-[#1F2430] text-xs font-mono text-gray-300 hover:text-white transition cursor-pointer"
            >
              Skip / Next Phase →
            </button>
          )}
        </div>
      </div>

      {/* Error Alert Box */}
      {lastActionError && (
        <div className="w-full p-4 rounded-xl bg-red-950/40 border border-red-800/60 backdrop-blur-md flex items-center gap-3 text-red-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{lastActionError}</span>
        </div>
      )}

      {/* Night Events Announcement Box (if in Day) */}
      {nightEvents.length > 0 && phase === 'DAY' && (
        <div className="w-full p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 backdrop-blur-md flex items-start gap-3 text-amber-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1">
            <h4 className="font-bold uppercase tracking-wider text-xs text-amber-400 font-mono">Dawn Report:</h4>
            {nightEvents.map((evt, idx) => (
              <p key={idx} className="font-serif italic">{evt}</p>
            ))}
          </div>
        </div>
      )}

      {/* Surviving Players Roster (Grid of Frosted Glass Cards) */}
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" /> Surviving Players ({livingPlayers.length})
          </h2>
          <span className="text-xs font-mono text-[#64748B]">
            {eliminatedPlayers.length} Eliminated
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {livingPlayers.map((player) => {
            const hasVoted = Boolean(votes[player.socket_id]);
            return (
              <div
                key={player.socket_id}
                className="p-4 rounded-2xl bg-[#12141C]/80 border border-[#1F2430] hover:border-amber-500/40 transition flex flex-col items-center text-center gap-3 backdrop-blur-xl shadow-lg relative group"
              >
                {/* Avatar Icon */}
                <div className="w-14 h-14 rounded-2xl bg-[#191C28] border border-[#1F2430] group-hover:border-amber-500/50 flex items-center justify-center text-white text-lg font-black shadow-inner">
                  {player.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="space-y-0.5 w-full">
                  <h3 className="font-bold text-white text-sm truncate">{player.name}</h3>
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-[#22C55E]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                    <span>Alive</span>
                  </div>
                </div>

                {/* Day Phase Voting Indicator */}
                {phase === 'DAY' && (
                  <div className="w-full pt-1 border-t border-[#1F2430]/60">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                      hasVoted
                        ? 'bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E]'
                        : 'bg-neutral-800/50 text-[#64748B]'
                    }`}>
                      {hasVoted ? '✓ Voted' : 'Thinking...'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Eliminated Players List */}
      {eliminatedPlayers.length > 0 && (
        <div className="w-full space-y-3 pt-4 border-t border-[#1F2430]/50">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#64748B] flex items-center gap-2">
            <Skull className="w-4 h-4 text-red-500" /> Graveyard ({eliminatedPlayers.length})
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {eliminatedPlayers.map((player) => (
              <div
                key={player.socket_id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0d0f14]/80 border border-red-950/60 text-xs font-mono text-[#64748B]"
              >
                <Skull className="w-3.5 h-3.5 text-red-600" />
                <span className="line-through text-gray-400">{player.name}</span>
                <span className="text-[10px] uppercase text-red-500">({player.role})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MafiaHost;
