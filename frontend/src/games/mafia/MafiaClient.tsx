import React, { useState } from 'react';
import { useMafiaStore } from './mafiaStore';
import type { MafiaRole } from './mafiaStore';
import {
  Skull,
  Shield,
  Search,
  Users,
  Moon,
  Sun,
  Crosshair,
  HeartPulse,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';

const ROLE_INFO: Record<MafiaRole, { title: string; color: string; description: string; icon: any }> = {
  mafia: {
    title: 'The Mafia',
    color: 'from-red-600 to-rose-700',
    description: 'Each night, choose a target with your syndicate to eliminate from the town.',
    icon: Skull
  },
  doctor: {
    title: 'The Doctor',
    color: 'from-emerald-600 to-teal-700',
    description: 'Each night, choose one player to save. If targeted by the Mafia, they will survive.',
    icon: HeartPulse
  },
  detective: {
    title: 'The Detective',
    color: 'from-blue-600 to-indigo-700',
    description: 'Each night, investigate a suspect to discover if they belong to the Mafia.',
    icon: Search
  },
  citizen: {
    title: 'Innocent Citizen',
    color: 'from-slate-600 to-gray-700',
    description: 'You have no special night abilities. Sleep tight and use deduction to vote during the day.',
    icon: Users
  }
};

export const MafiaClient: React.FC = () => {
  const {
    phase,
    players,
    timeLeft,
    getMyPlayer,
    selectedActionTarget,
    myInvestigation,
    submitNightAction,
    investigatePlayer,
    submitVote
  } = useMafiaStore();

  const me = getMyPlayer();

  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  // 1. Spectator / Eliminated Screen
  if (me && !me.is_alive && phase !== 'GAME_OVER' && phase !== 'LOBBY') {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 text-center select-none z-50">
        <div className="w-20 h-20 rounded-3xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-500 mb-6 shadow-2xl animate-pulse">
          <Skull className="w-10 h-10" />
        </div>
        <div className="max-w-md space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-red-950/50 border border-red-900/60 text-red-400 font-mono text-xs uppercase tracking-widest">
            Spectator Mode
          </span>
          <h1 className="text-3xl font-serif text-white font-light">
            You have been eliminated.
          </h1>
          <p className="text-sm text-[#94A3B8] font-serif">
            Maintain silence and watch the remaining players find the Mafia syndicate.
          </p>
        </div>
      </div>
    );
  }

  // 2. Role Reveal Screen
  if (phase === 'ROLE_REVEAL' && me) {
    const roleMeta = ROLE_INFO[me.role] || ROLE_INFO.citizen;
    const Icon = roleMeta.icon;

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[80vh] p-6 text-center animate-fadeIn">
        <div className="w-full p-8 rounded-3xl bg-[#12141C] border border-[#1F2430] shadow-2xl backdrop-blur-xl flex flex-col items-center gap-6 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#191C28] border border-[#1F2430] text-xs font-mono text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Secret Identity Assigned</span>
          </div>

          <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${roleMeta.color} flex items-center justify-center text-white shadow-2xl`}>
            <Icon className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-wider text-white">
              {roleMeta.title}
            </h1>
            <p className="text-sm text-[#94A3B8] font-serif leading-relaxed">
              {roleMeta.description}
            </p>
          </div>

          <div className="w-full pt-4 border-t border-[#1F2430] flex items-center justify-between text-xs font-mono text-[#64748B]">
            <span>Player: {me.name}</span>
            <span>Starting soon ({timeLeft}s)...</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Night Phase Action UI
  if (phase === 'NIGHT' && me && me.is_alive) {
    const eligibleTargets = players.filter((p) => p.is_alive && (me.role === 'mafia' ? p.role !== 'mafia' : true));

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-5 p-4 py-8 select-none animate-fadeIn">
        {/* Night Header */}
        <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#12141C] border border-[#1F2430] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold tracking-wider">Night Falls</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">{me.role} Turn</h2>
            </div>
          </div>

          {timeLeft > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#090A0F] border border-[#1F2430] text-amber-400 font-mono text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
          )}
        </div>

        {/* Citizen Sleeping Screen */}
        {me.role === 'citizen' && (
          <div className="w-full p-8 rounded-3xl bg-[#12141C] border border-[#1F2430] flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-center text-indigo-400 animate-pulse">
              <Moon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif text-gray-200">The Town is Asleep</h3>
            <p className="text-xs text-[#94A3B8] font-serif leading-relaxed">
              You are an innocent citizen. Keep your eyes closed and wait for morning to arrive.
            </p>
          </div>
        )}

        {/* Mafia Target Elimination UI */}
        {me.role === 'mafia' && (
          <div className="w-full space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Choose a Player to Eliminate</h3>
              <p className="text-xs text-[#94A3B8]">Select a victim for the Mafia strike tonight.</p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {eligibleTargets.map((player) => {
                const isSelected = selectedTarget === player.socket_id || selectedActionTarget === player.socket_id;
                return (
                  <button
                    key={player.socket_id}
                    onClick={() => {
                      setSelectedTarget(player.socket_id);
                      submitNightAction(player.socket_id);
                    }}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? 'bg-red-950/60 border-red-600 text-white shadow-lg shadow-red-950/50'
                        : 'bg-[#12141C] border-[#1F2430] hover:border-red-500/50 text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#191C28] flex items-center justify-center text-sm font-bold text-white">
                        {player.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-sm">{player.name}</span>
                    </div>
                    {isSelected ? <Crosshair className="w-5 h-5 text-red-500" /> : <div className="w-4 h-4 rounded-full border border-[#1F2430]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Doctor Save Action UI */}
        {me.role === 'doctor' && (
          <div className="w-full space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Choose a Patient to Protect</h3>
              <p className="text-xs text-[#94A3B8]">They will be shielded from Mafia attacks tonight.</p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {eligibleTargets.map((player) => {
                const isSelected = selectedTarget === player.socket_id || selectedActionTarget === player.socket_id;
                return (
                  <button
                    key={player.socket_id}
                    onClick={() => {
                      setSelectedTarget(player.socket_id);
                      submitNightAction(player.socket_id);
                    }}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                        : 'bg-[#12141C] border-[#1F2430] hover:border-emerald-500/50 text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#191C28] flex items-center justify-center text-sm font-bold text-white">
                        {player.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-sm">{player.name}</span>
                    </div>
                    {isSelected ? <Shield className="w-5 h-5 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border border-[#1F2430]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Detective Investigation Action UI */}
        {me.role === 'detective' && (
          <div className="w-full space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Investigate a Suspect</h3>
              <p className="text-xs text-[#94A3B8]">Discover their secret alignment.</p>
            </div>

            {myInvestigation && (
              <div className={`p-4 rounded-2xl border text-center space-y-2 animate-fadeIn ${
                myInvestigation.is_mafia
                  ? 'bg-red-950/40 border-red-700 text-red-300'
                  : 'bg-blue-950/40 border-blue-700 text-blue-300'
              }`}>
                <div className="text-xs font-mono uppercase font-bold tracking-widest">Investigation Dossier</div>
                <h4 className="text-xl font-serif text-white font-bold">{myInvestigation.target_name}</h4>
                <p className="text-sm font-bold uppercase tracking-wider">
                  {myInvestigation.is_mafia ? '⚠️ Identified as MAFIA' : '✓ Appears INNOCENT'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2.5">
              {eligibleTargets.filter(p => p.socket_id !== me.socket_id).map((player) => {
                const isSelected = selectedTarget === player.socket_id || selectedActionTarget === player.socket_id;
                return (
                  <button
                    key={player.socket_id}
                    onClick={() => {
                      setSelectedTarget(player.socket_id);
                      investigatePlayer(player.socket_id);
                    }}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-600 text-white shadow-lg shadow-blue-950/50'
                        : 'bg-[#12141C] border-[#1F2430] hover:border-blue-500/50 text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#191C28] flex items-center justify-center text-sm font-bold text-white">
                        {player.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-sm">{player.name}</span>
                    </div>
                    {isSelected ? <Search className="w-5 h-5 text-blue-400" /> : <div className="w-4 h-4 rounded-full border border-[#1F2430]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. Day Phase Voting UI
  if (phase === 'DAY' && me && me.is_alive) {
    const livingTargets = players.filter((p) => p.is_alive && p.socket_id !== me.socket_id);

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-5 p-4 py-8 select-none animate-fadeIn">
        {/* Day Header */}
        <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#12141C] border border-[#1F2430] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">Daylight Discussion</span>
              <h2 className="text-sm font-bold text-white">Vote Out a Suspect</h2>
            </div>
          </div>

          {timeLeft > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#090A0F] border border-[#1F2430] text-amber-400 font-mono text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
          )}
        </div>

        {/* Voting List */}
        <div className="w-full space-y-2.5">
          {livingTargets.map((player) => {
            const isVoted = selectedTarget === player.socket_id;
            return (
              <button
                key={player.socket_id}
                onClick={() => {
                  setSelectedTarget(player.socket_id);
                  submitVote(player.socket_id);
                }}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer active:scale-[0.98] ${
                  isVoted
                    ? 'bg-amber-950/60 border-amber-600 text-white shadow-lg shadow-amber-950/50'
                    : 'bg-[#12141C] border-[#1F2430] hover:border-amber-500/50 text-[#94A3B8] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#191C28] flex items-center justify-center text-sm font-bold text-white">
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-bold text-sm">{player.name}</span>
                </div>
                {isVoted ? (
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                ) : (
                  <span className="text-xs font-mono text-[#64748B] hover:text-amber-400">Vote</span>
                )}
              </button>
            );
          })}

          <button
            onClick={() => {
              setSelectedTarget('skip');
              submitVote('skip');
            }}
            className={`w-full p-3.5 rounded-2xl border text-center font-mono text-xs font-bold uppercase transition cursor-pointer ${
              selectedTarget === 'skip'
                ? 'bg-neutral-800 border-white text-white'
                : 'bg-[#090A0F] border-[#1F2430] text-[#94A3B8] hover:text-white'
            }`}
          >
            Skip / Abstain from Voting
          </button>
        </div>
      </div>
    );
  }

  // 5. Default Waiting Screen
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#12141C] border border-[#1F2430] flex items-center justify-center text-amber-400 animate-pulse mb-4">
        <Moon className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-white">Connecting to Mafia Session...</h2>
      <p className="text-xs text-[#94A3B8] mt-2">Look at the Host display for ongoing verdicts and announcements.</p>
    </div>
  );
};

export default MafiaClient;
