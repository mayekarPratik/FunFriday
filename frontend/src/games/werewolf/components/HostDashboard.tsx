import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useWerewolfStore } from '../werewolfStore';
import { useCoreStore } from '../../../store/coreStore';
import type { RoleSettings, Player } from '../../../types/game';
import { DEFAULT_GAME_SETTINGS } from '../../../types/game';
import {
  Users,
  Copy,
  Check,
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
  Clock,
  Shield,
  ArrowLeft
} from 'lucide-react';

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
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30'
  },
  seer: {
    id: 'seer',
    name: 'Seer',
    desc: 'Investigates one player identity each night',
    icon: Eye,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30'
  },
  doctor: {
    id: 'doctor',
    name: 'Doctor',
    desc: 'Protects one player from death each night',
    icon: HeartPulse,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30'
  },
  villager: {
    id: 'villager',
    name: 'Villager',
    desc: 'Simple townsperson seeking truth by day',
    icon: Shield,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30'
  },
  sheriff: {
    id: 'sheriff',
    name: 'Sheriff',
    desc: 'Holds a single lethal silver bullet',
    icon: Target,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  },
  jester: {
    id: 'jester',
    name: 'Jester',
    desc: 'Wins solo if executed during day voting',
    icon: Sparkles,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  },
  witch: {
    id: 'witch',
    name: 'Witch',
    desc: 'One heal potion & one poison potion per match',
    icon: FlaskConical,
    color: 'text-fuchsia-400',
    bgColor: 'bg-fuchsia-500/10',
    borderColor: 'border-fuchsia-500/30'
  },
  executioner: {
    id: 'executioner',
    name: 'Executioner',
    desc: 'Wins if secret marked target is voted out by day',
    icon: Target,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30'
  },
  cupid: {
    id: 'cupid',
    name: 'Cupid',
    desc: 'Links two players as lovers on night 1',
    icon: Heart,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30'
  }
};

export const HostDashboard: React.FC = () => {
  const {
    gameState,
    role_settings,
    settings,
    updateRoleSettings,
    updateRoomSettings,
    startGame
  } = useWerewolfStore();

  const { roomCode, players, setCurrentGameId, leaveRoom } = useCoreStore();

  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  // Active Tab: 'roles' (deck builder) vs 'timers' (custom rules)
  const [activeTab, setActiveTab] = useState<'roles' | 'timers'>('roles');

  const displayRoomCode = roomCode || gameState?.room_code;
  const currentPlayers = players.length > 0 ? players : (gameState?.players || []);

  const handleCopyCode = () => {
    if (!displayRoomCode) return;
    navigator.clipboard.writeText(displayRoomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleChange = (roleKey: keyof RoleSettings, delta: number) => {
    const current = Number(role_settings[roleKey] || 0);
    const updated = Math.max(0, current + delta);
    updateRoleSettings({
      ...role_settings,
      [roleKey]: updated
    });
  };

  const totalAssignedRoles = ROLE_CONFIG_ORDER.reduce(
    (acc: number, roleKey: keyof RoleSettings) => acc + Number(role_settings[roleKey] || 0),
    0
  );

  const playerCount = currentPlayers.length;
  const isCountMatched = totalAssignedRoles === playerCount;
  const canStart = playerCount >= 3 && isCountMatched && !starting;

  const handleStartGame = async () => {
    if (playerCount < 3) {
      toast.error('At least 3 players are required to start the game.');
      return;
    }
    if (!isCountMatched) {
      toast.error(`Role count (${totalAssignedRoles}) does not match players joined (${playerCount}).`);
      return;
    }

    setStarting(true);
    const res = await startGame();
    setStarting(false);
    if (!res.success) {
      toast.error(res.error || 'Failed to start game. Please try again.');
    }
  };

  const handleDiscussionTimeChange = (deltaSeconds: number) => {
    const current = settings?.discussion_time_seconds || DEFAULT_GAME_SETTINGS.discussion_time_seconds;
    const updated = Math.max(60, current + deltaSeconds);
    updateRoomSettings({
      ...settings,
      discussion_time_seconds: updated
    });
  };

  const handleActionTimeChange = (deltaSeconds: number) => {
    const current = settings?.action_time_seconds || DEFAULT_GAME_SETTINGS.action_time_seconds;
    const updated = Math.max(3, current + deltaSeconds);
    updateRoomSettings({
      ...settings,
      action_time_seconds: updated
    });
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto box-border py-4 px-2 sm:px-4 selection:bg-[#3B82F6]/30">
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 sm:gap-8">
        {/* Top Header Card */}
      <div className="wope-card p-6 sm:p-8 w-full flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentGameId(null)}
            className="w-10 h-10 rounded-xl bg-[#090A0F] border border-[#1F2430] hover:border-[#3B82F6] flex items-center justify-center text-[#94A3B8] hover:text-white transition cursor-pointer"
            title="Back to The Lobby"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-[#191C28] border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg">
            <Skull className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-mono uppercase font-bold tracking-wider">
                Werewolf Lobby
              </span>
              <span className="flex items-center gap-1 text-xs text-[#22C55E] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                Live Room
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              Werewolf Role Setup
            </h1>
          </div>
        </div>

        {/* Room Code Pill & Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#090A0F] border border-[#1F2430] hover:border-[#3B82F6]/50 transition text-white font-mono cursor-pointer"
            title="Click to copy Room Code"
          >
            <span className="text-xs text-[#94A3B8]">Room:</span>
            <span className="font-bold text-lg tracking-widest text-[#3B82F6]">{displayRoomCode}</span>
            {copied ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4 text-[#94A3B8]" />}
          </button>

          <button
            onClick={leaveRoom}
            className="p-3 rounded-xl bg-[#090A0F] border border-[#1F2430] hover:border-[#EF4444]/50 text-[#94A3B8] hover:text-[#EF4444] transition cursor-pointer"
            title="Leave Lobby"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Deck Builder & Player Roster */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Role Deck Builder & Timers (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Tabs: Role Setup vs Custom Settings */}
          <div className="flex items-center justify-between border-b border-[#1F2430] pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('roles')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'roles'
                    ? 'bg-[#191C28] text-white border border-[#1F2430]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" /> Role Deck ({totalAssignedRoles}/{playerCount})
              </button>
              <button
                onClick={() => setActiveTab('timers')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'timers'
                    ? 'bg-[#191C28] text-white border border-[#1F2430]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Game Timers & Rules
              </button>
            </div>

            <div className="text-xs font-mono">
              <span className={isCountMatched ? 'text-[#22C55E]' : 'text-amber-400 font-bold'}>
                {totalAssignedRoles} assigned / {playerCount} joined
              </span>
            </div>
          </div>

          {/* TAB 1: ROLE DECK BUILDER */}
          {activeTab === 'roles' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLE_CONFIG_ORDER.map((roleKey) => {
                const config = ROLE_CONFIG_MAP[roleKey];
                const count = Number(role_settings[roleKey] || 0);
                const Icon = config.icon;

                return (
                  <div
                    key={String(roleKey)}
                    className={`p-4 rounded-2xl bg-[#12141C] border ${
                      count > 0 ? config.borderColor : 'border-[#1F2430]'
                    } flex items-center justify-between gap-3 shadow-md transition`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white">{config.name}</span>
                        <span className="text-[11px] text-[#94A3B8] line-clamp-1">{config.desc}</span>
                      </div>
                    </div>

                    {/* Counter Buttons */}
                    <div className="flex items-center gap-2 bg-[#090A0F] border border-[#1F2430] rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => handleRoleChange(roleKey, -1)}
                        disabled={count <= 0}
                        className="w-7 h-7 rounded-lg bg-[#12141C] hover:bg-[#191C28] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white cursor-pointer transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-6 text-center font-mono font-bold text-sm text-white">
                        {count}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRoleChange(roleKey, 1)}
                        className="w-7 h-7 rounded-lg bg-[#12141C] hover:bg-[#191C28] flex items-center justify-center text-white cursor-pointer transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: GAME TIMERS & RULES */}
          {activeTab === 'timers' && (
            <div className="flex flex-col gap-4">
              {/* Discussion Timer */}
              <div className="p-5 rounded-2xl bg-[#12141C] border border-[#1F2430] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Day Discussion & Trial Timer</h3>
                  <p className="text-xs text-[#94A3B8]">Time allowed for public debate and voting</p>
                </div>
                <div className="flex items-center gap-3 bg-[#090A0F] border border-[#1F2430] rounded-xl p-1.5">
                  <button
                    onClick={() => handleDiscussionTimeChange(-30)}
                    className="w-8 h-8 rounded-lg bg-[#12141C] hover:bg-[#191C28] flex items-center justify-center text-white cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-mono font-bold text-sm text-white px-2">
                    {Math.floor((settings?.discussion_time_seconds || 300) / 60)}m {(settings?.discussion_time_seconds || 300) % 60}s
                  </span>
                  <button
                    onClick={() => handleDiscussionTimeChange(30)}
                    className="w-8 h-8 rounded-lg bg-[#12141C] hover:bg-[#191C28] flex items-center justify-center text-white cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Night Action Window */}
              <div className="p-5 rounded-2xl bg-[#12141C] border border-[#1F2430] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Night Role Secret Action Window</h3>
                  <p className="text-xs text-[#94A3B8]">Secret phone screen reveal duration per role</p>
                </div>
                <div className="flex items-center gap-3 bg-[#090A0F] border border-[#1F2430] rounded-xl p-1.5">
                  <button
                    onClick={() => handleActionTimeChange(-1)}
                    className="w-8 h-8 rounded-lg bg-[#12141C] hover:bg-[#191C28] flex items-center justify-center text-white cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-mono font-bold text-sm text-white px-2">
                    {settings?.action_time_seconds || 6}s
                  </span>
                  <button
                    onClick={() => handleActionTimeChange(1)}
                    className="w-8 h-8 rounded-lg bg-[#12141C] hover:bg-[#191C28] flex items-center justify-center text-white cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Joined Players & Launch Button (1 Col) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#22C55E]" /> Players ({playerCount})
            </h2>
            <span className="text-xs font-mono text-[#94A3B8]">
              {playerCount < 3 ? 'Needs min. 3' : 'Ready'}
            </span>
          </div>

          <div className="rounded-2xl p-5 bg-[#12141C] border border-[#1F2430] flex flex-col gap-3 min-h-[300px] shadow-xl">
            {playerCount === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#64748B]">
                <Users className="w-10 h-10 mb-2 stroke-1 opacity-50" />
                <p className="text-sm font-medium">Waiting for players to join...</p>
                <p className="text-xs text-[#475569] mt-1">
                  Connect on mobile with code <span className="font-mono text-white font-bold">{displayRoomCode}</span>
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
                {currentPlayers.map((player: Player, index: number) => (
                  <div
                    key={player.socket_id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#090A0F] border border-[#1F2430]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#191C28] border border-[#1F2430] flex items-center justify-center text-xs font-mono font-bold text-[#3B82F6]">
                        #{index + 1}
                      </div>
                      <span className="text-sm font-semibold text-white truncate max-w-[130px]">
                        {player.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-[#22C55E]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                      Joined
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Launch Game Button */}
          <button
            type="button"
            onClick={handleStartGame}
            disabled={!canStart}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-sm text-white uppercase tracking-wider shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {starting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Dealing Roles...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>Start Werewolf Match</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

export default HostDashboard;
