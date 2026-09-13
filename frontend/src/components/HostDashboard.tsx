import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { RoleSettings } from '../types/game';
import {
  Users,
  Crown,
  Copy,
  Check,
  Tv,
  Play,
  LogOut,
  RefreshCw,
  Plus,
  Minus,
  Skull,
  Eye,
  HeartPulse,
  FlaskConical,
  Heart,
  Sparkles,
  Target,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Settings,
  Shield
} from 'lucide-react';
import type { GameSettings } from '../types/game';
import { DEFAULT_GAME_SETTINGS } from '../types/game';

export const ROLE_CONFIG_ORDER: (keyof RoleSettings)[] = [
  'werewolf',
  'seer',
  'doctor',
  'villager',
  'sheriff',
  'jester',
  'witch',
  'executioner',
  'cupid'
];

interface RoleConfigItem {
  id: keyof RoleSettings;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const ROLE_CONFIG_MAP: Record<string, RoleConfigItem> = {
  werewolf: {
    id: 'werewolf',
    name: 'Werewolf',
    desc: 'Hunts villagers in secret each night',
    icon: Skull,
    color: 'text-red-500',
    bgColor: 'bg-red-950/30',
    borderColor: 'border-red-900/50'
  },
  seer: {
    id: 'seer',
    name: 'Seer',
    desc: 'Inspects true identities at night',
    icon: Eye,
    color: 'text-blue-400',
    bgColor: 'bg-blue-950/30',
    borderColor: 'border-blue-900/50'
  },
  doctor: {
    id: 'doctor',
    name: 'Doctor',
    desc: 'Heals one person from attacks each night',
    icon: HeartPulse,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/30',
    borderColor: 'border-emerald-900/50'
  },
  villager: {
    id: 'villager',
    name: 'Villager',
    desc: 'Deduces and votes out wolves by day',
    icon: Users,
    color: 'text-slate-300',
    bgColor: 'bg-slate-900/40',
    borderColor: 'border-slate-800'
  },
  sheriff: {
    id: 'sheriff',
    name: 'Sheriff',
    desc: 'Holds a single silver bullet to eliminate a suspect',
    icon: Shield,
    color: 'text-blue-400',
    bgColor: 'bg-blue-950/30',
    borderColor: 'border-blue-900/50'
  },
  jester: {
    id: 'jester',
    name: 'Jester',
    desc: 'Neutral trickster who wins if voted out',
    icon: Sparkles,
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/30',
    borderColor: 'border-purple-900/50'
  },
  witch: {
    id: 'witch',
    name: 'Witch',
    desc: 'Wields one heal and one lethal poison',
    icon: FlaskConical,
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/30',
    borderColor: 'border-purple-900/50'
  },
  executioner: {
    id: 'executioner',
    name: 'Executioner',
    desc: 'Neutral assassin hunting an assigned target',
    icon: Target,
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/30',
    borderColor: 'border-purple-900/50'
  },
  cupid: {
    id: 'cupid',
    name: 'Cupid',
    desc: 'Binds two secret lovers together',
    icon: Heart,
    color: 'text-pink-400',
    bgColor: 'bg-pink-950/30',
    borderColor: 'border-pink-900/50'
  }
};

export const HostDashboard: React.FC = () => {
  const { gameState, role_settings, settings, updateRoleSettings, updateRoomSettings, leaveRoom, startGame } = useGameStore();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  if (!gameState) return null;

  // Compute current settings from gameState or fallback to store
  const currentSettings: RoleSettings = gameState.role_settings || role_settings;
  const currentRoomSettings: GameSettings = gameState.settings || settings || DEFAULT_GAME_SETTINGS;

  const totalRolesInDeck = Object.values(currentSettings).reduce<number>(
    (sum, val) => sum + (typeof val === 'number' ? val : 0),
    0
  );

  const playersJoinedCount = gameState.players.length;
  const isDeckBalanced = totalRolesInDeck === playersJoinedCount && playersJoinedCount >= 3;

  const handleIncrement = (roleId: keyof RoleSettings) => {
    const nextValue = (currentSettings[roleId] || 0) + 1;
    const newSettings = {
      ...currentSettings,
      [roleId]: nextValue
    };
    updateRoleSettings(newSettings);
  };

  const handleDecrement = (roleId: keyof RoleSettings) => {
    const currentValue = currentSettings[roleId] || 0;
    if (currentValue <= 0) return;
    const newSettings = {
      ...currentSettings,
      [roleId]: currentValue - 1
    };
    updateRoleSettings(newSettings);
  };

  const handleAdjustDiscussionTime = (delta: number) => {
    const currentVal = currentRoomSettings.discussion_time_seconds || 300;
    const nextVal = Math.max(60, currentVal + delta);
    updateRoomSettings({
      ...currentRoomSettings,
      discussion_time_seconds: nextVal
    });
  };

  const handleAdjustActionTime = (delta: number) => {
    const currentVal = currentRoomSettings.action_time_seconds || 6;
    const nextVal = Math.max(3, currentVal + delta);
    updateRoomSettings({
      ...currentRoomSettings,
      action_time_seconds: nextVal
    });
  };

  const handleAdjustSheriffBullets = (delta: number) => {
    const currentVal = currentRoomSettings.sheriff_bullets || 1;
    const nextVal = Math.min(5, Math.max(1, currentVal + delta));
    updateRoomSettings({
      ...currentRoomSettings,
      sheriff_bullets: nextVal
    });
  };

  const handleStartGame = async () => {
    if (!isDeckBalanced || starting) return;
    setStarting(true);
    await startGame();
    setStarting(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameState.room_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-12">
      {/* Top Banner / Room Header */}
      <div className="wope-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#3B82F6]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left z-0">
          <div className="w-16 h-16 rounded-2xl bg-[#191C28] border border-[#1F2430] flex items-center justify-center text-[#3B82F6] shrink-0">
            <Tv className="w-8 h-8" />
          </div>

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="text-xs uppercase font-mono tracking-widest text-[#94A3B8]">
                Host Station
              </span>
              <span className="wope-badge bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30 font-mono text-[10px]">
                LOBBY PHASE
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#F8FAFC]">
              Deck Builder & Lobby
            </h1>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Customize the role distribution to match connected players before beginning.
            </p>
          </div>
        </div>

        {/* Big Room Code Display */}
        <div className="flex items-center gap-3 bg-[#090A0F] border border-[#1F2430] p-3 sm:px-6 sm:py-4 rounded-xl z-0">
          <div className="text-left">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#94A3B8] block">
              ROOM CODE
            </span>
            <span className="text-4xl sm:text-5xl font-black tracking-widest text-[#3B82F6] font-mono select-all">
              {gameState.room_code}
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            title="Copy Room Code"
            className="p-2.5 rounded-lg border border-[#1F2430] bg-[#12141C] hover:bg-[#191C28] text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
          >
            {copied ? <Check className="w-5 h-5 text-[#22C55E]" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Validation & Launch Bar */}
      <div className="wope-card p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 border border-[#1F2430]">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
          {/* Validation text */}
          <div className="flex items-center gap-2.5">
            {isDeckBalanced ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <span className="text-sm font-bold font-mono tracking-wide text-[#F8FAFC]">
                Roles in Deck: {totalRolesInDeck} / Players Joined: {playersJoinedCount}
              </span>
              <p className="text-xs text-[#94A3B8]">
                {playersJoinedCount < 3
                  ? 'Need at least 3 players to start the game.'
                  : isDeckBalanced
                  ? 'Deck balanced! Ready to start.'
                  : totalRolesInDeck < playersJoinedCount
                  ? `Add ${playersJoinedCount - totalRolesInDeck} more role(s) to match player count.`
                  : `Remove ${totalRolesInDeck - playersJoinedCount} role(s) to match player count.`}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={leaveRoom}
            className="wope-btn-secondary px-3.5 py-2.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer text-[#94A3B8] hover:text-[#EF4444]"
          >
            <LogOut className="w-3.5 h-3.5" /> Close Room
          </button>

          <button
            onClick={handleStartGame}
            disabled={!isDeckBalanced || starting}
            title={
              !isDeckBalanced
                ? 'Roles in deck must match number of joined players (min 3)'
                : 'Start Game'
            }
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
              isDeckBalanced && !starting
                ? 'bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-[#3B82F6]/25 active:scale-[0.98]'
                : 'bg-neutral-800 text-neutral-500 border border-neutral-700/50 opacity-50 cursor-not-allowed'
            }`}
          >
            {starting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Launching...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start Game</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Deck Builder on Left, Joined Players on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Deck Builder Configuration Menu (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#3B82F6]" />
              <h2 className="text-lg font-bold text-[#F8FAFC]">Role Configuration</h2>
            </div>
            <span className="text-xs font-mono text-[#94A3B8]">
              {ROLE_CONFIG_ORDER.length} Available Roles
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ROLE_CONFIG_ORDER.map((roleKey) => {
              const role = ROLE_CONFIG_MAP[roleKey];
              if (!role) return null;
              const RoleIcon = role.icon;
              const count = currentSettings[roleKey] ?? (roleKey === 'werewolf' ? currentSettings['wolf'] : 0) ?? 0;

              return (
                <div
                  key={roleKey}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    count > 0
                      ? `${role.bgColor} ${role.borderColor} shadow-md`
                      : 'bg-[#12141C] border-[#1F2430] opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${role.bgColor} ${role.borderColor} ${role.color}`}
                    >
                      <RoleIcon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-[#F8FAFC] truncate">
                          {role.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] truncate">
                        {role.desc}
                      </p>
                    </div>
                  </div>

                  {/* Increment / Decrement Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDecrement(roleKey)}
                      disabled={count <= 0}
                      className="w-7 h-7 rounded-lg bg-[#090A0F] border border-[#1F2430] hover:border-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-[#F8FAFC] transition active:scale-95 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <span
                      className={`w-6 text-center font-mono font-bold text-sm ${
                        count > 0 ? role.color : 'text-neutral-500'
                      }`}
                    >
                      {count}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleIncrement(roleKey)}
                      className="w-7 h-7 rounded-lg bg-[#090A0F] border border-[#1F2430] hover:border-neutral-500 flex items-center justify-center text-[#F8FAFC] transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Game Settings Control Panel */}
          <div className="wope-card p-5 flex flex-col gap-4 border border-[#1F2430] bg-[#12141C]/80 mt-2">
            <div className="flex items-center justify-between border-b border-[#1F2430] pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#3B82F6]" />
                <h3 className="text-sm font-bold text-[#F8FAFC]">Game Timers & Settings</h3>
              </div>
              <span className="text-[11px] font-mono text-[#94A3B8]">Custom Rules</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Discussion Phase Time */}
              <div className="p-3 rounded-xl bg-[#090A0F] border border-[#1F2430] flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Discussion Time
                  </span>
                  <p className="text-[10px] text-[#94A3B8]">Day trial timer duration</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAdjustDiscussionTime(-30)}
                    disabled={(currentRoomSettings.discussion_time_seconds || 300) <= 60}
                    className="w-7 h-7 rounded-lg bg-[#12141C] border border-[#1F2430] hover:border-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-[#F8FAFC] transition active:scale-95 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="w-12 text-center font-mono font-bold text-xs text-amber-400">
                    {Math.floor((currentRoomSettings.discussion_time_seconds || 300) / 60)}m{' '}
                    {(currentRoomSettings.discussion_time_seconds || 300) % 60 > 0
                      ? `${(currentRoomSettings.discussion_time_seconds || 300) % 60}s`
                      : ''}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleAdjustDiscussionTime(30)}
                    className="w-7 h-7 rounded-lg bg-[#12141C] border border-[#1F2430] hover:border-neutral-500 flex items-center justify-center text-[#F8FAFC] transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Action Screen Time */}
              <div className="p-3 rounded-xl bg-[#090A0F] border border-[#1F2430] flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" /> Action Screen Time
                  </span>
                  <p className="text-[10px] text-[#94A3B8]">Night check turn window</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAdjustActionTime(-1)}
                    disabled={(currentRoomSettings.action_time_seconds || 6) <= 3}
                    className="w-7 h-7 rounded-lg bg-[#12141C] border border-[#1F2430] hover:border-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-[#F8FAFC] transition active:scale-95 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="w-10 text-center font-mono font-bold text-xs text-blue-400">
                    {currentRoomSettings.action_time_seconds || 6}s
                  </span>

                  <button
                    type="button"
                    onClick={() => handleAdjustActionTime(1)}
                    className="w-7 h-7 rounded-lg bg-[#12141C] border border-[#1F2430] hover:border-neutral-500 flex items-center justify-center text-[#F8FAFC] transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Sheriff Bullets Count */}
              <div className="p-3 rounded-xl bg-[#090A0F] border border-[#1F2430] flex items-center justify-between gap-3 sm:col-span-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-400" /> Sheriff Bullets
                  </span>
                  <p className="text-[10px] text-[#94A3B8]">Total silver bullets loaded for Sheriff</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAdjustSheriffBullets(-1)}
                    disabled={(currentRoomSettings.sheriff_bullets || 1) <= 1}
                    className="w-7 h-7 rounded-lg bg-[#12141C] border border-[#1F2430] hover:border-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-[#F8FAFC] transition active:scale-95 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="w-10 text-center font-mono font-bold text-xs text-blue-400">
                    {currentRoomSettings.sheriff_bullets || 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleAdjustSheriffBullets(1)}
                    disabled={(currentRoomSettings.sheriff_bullets || 1) >= 5}
                    className="w-7 h-7 rounded-lg bg-[#12141C] border border-[#1F2430] hover:border-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-[#F8FAFC] transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Joined Players List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#3B82F6]" />
              <h2 className="text-lg font-bold text-[#F8FAFC]">Joined Players</h2>
            </div>
            <span className="text-xs font-mono text-[#94A3B8]">
              {playersJoinedCount} Connected
            </span>
          </div>

          {playersJoinedCount === 0 ? (
            <div className="wope-card p-10 text-center flex flex-col items-center justify-center gap-3 border-dashed h-full min-h-[260px]">
              <div className="w-12 h-12 rounded-full bg-[#191C28] border border-[#1F2430] flex items-center justify-center text-[#94A3B8] animate-pulse">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-[#F8FAFC] text-sm">
                  Waiting for Players...
                </h3>
                <p className="text-xs text-[#94A3B8] max-w-xs mx-auto">
                  Players join by entering room code{' '}
                  <span className="font-mono font-bold text-[#3B82F6]">
                    {gameState.room_code}
                  </span>{' '}
                  on their mobile phones.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
              {gameState.players.map((player, index) => {
                const isHostSocket = player.socket_id === gameState.host_socket_id;
                const isAlive = player.is_alive;

                return (
                  <div
                    key={player.socket_id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 animate-fadeIn ${
                      isAlive
                        ? 'bg-[#12141C] border-[#1F2430]'
                        : 'bg-black/50 border-neutral-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs shadow-sm shrink-0 ${
                          isAlive
                            ? 'bg-gradient-to-tr from-[#1E293B] to-[#334155] border-[#1F2430] text-[#F8FAFC]'
                            : 'bg-neutral-950 border-neutral-900 text-neutral-600'
                        }`}
                      >
                        {isAlive ? (
                          player.name.charAt(0).toUpperCase()
                        ) : (
                          <Skull className="w-4 h-4 text-red-700" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`font-bold text-sm truncate ${
                            isAlive ? 'text-[#F8FAFC]' : 'line-through text-gray-700'
                          }`}
                        >
                          {player.name}
                        </p>
                        <p className="text-[10px] font-mono text-[#94A3B8]">
                          {isAlive ? `Player #${index + 1}` : 'Eliminated (💀 Dead)'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isAlive && (
                        <span className="wope-badge bg-red-950/40 text-red-700 border-red-900/50 flex items-center gap-1 text-[10px]">
                          💀 Dead
                        </span>
                      )}
                      {isHostSocket && (
                        <span className="wope-badge bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/30 flex items-center gap-1 text-[10px]">
                          <Crown className="w-3 h-3" /> Host
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
