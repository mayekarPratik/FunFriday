import React, { useState } from 'react';
import { useCoreStore } from '../store/coreStore';
import {
  Users,
  Copy,
  Check,
  Tv,
  Play,
  LogOut,
  Sparkles,
  Lock,
  Flame,
  Shield,
  Skull
} from 'lucide-react';

interface GameHubCard {
  id: string;
  name: string;
  tagline: string;
  minPlayers: number;
  maxPlayers: number;
  category: string;
  badge?: string;
  enabled: boolean;
  accentColor: string;
  borderColor: string;
  glowColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AVAILABLE_GAMES: GameHubCard[] = [
  {
    id: 'werewolf',
    name: 'Werewolf',
    tagline: 'Deception, secret roles, and night kills. Can the village root out the wolves?',
    minPlayers: 4,
    maxPlayers: 16,
    category: 'Social Deduction',
    badge: 'Popular',
    enabled: true,
    accentColor: 'from-red-600 to-rose-700',
    borderColor: 'border-red-500/40 hover:border-red-500',
    glowColor: 'group-hover:bg-red-500/10',
    icon: Skull
  },
  {
    id: 'mafia',
    name: 'Mafia / Undercover',
    tagline: 'The classic mobster deception game with undercover detectives and secret hits.',
    minPlayers: 3,
    maxPlayers: 20,
    category: 'Classic Party',
    badge: 'New',
    enabled: true,
    accentColor: 'from-amber-600 to-orange-700',
    borderColor: 'border-amber-500/40 hover:border-amber-500',
    glowColor: 'group-hover:bg-amber-500/10',
    icon: Flame
  },
  {
    id: 'secret_hitler',
    name: 'Secret Chancellor',
    tagline: 'Pass liberal & fascist policies while uncovering the secret leader in power.',
    minPlayers: 5,
    maxPlayers: 10,
    category: 'Political Intrigue',
    badge: 'In Development',
    enabled: false,
    accentColor: 'from-indigo-600 to-purple-700',
    borderColor: 'border-[#1F2430]',
    glowColor: 'group-hover:bg-indigo-500/5',
    icon: Shield
  }
];

export const LobbyHost: React.FC = () => {
  const {
    roomCode,
    players,
    selectGame,
    leaveRoom
  } = useCoreStore();

  const [copied, setCopied] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectGame = async (gameId: string) => {
    const game = AVAILABLE_GAMES.find((g) => g.id === gameId);
    if (!game || !game.enabled) return;

    setIsLaunching(true);
    await selectGame(gameId);
    setIsLaunching(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-8 py-6 px-4">
      {/* Top Host Header Banner */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-[#12141C] border border-[#1F2430] shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#191C28] border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] shadow-lg">
            <Tv className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] text-[10px] font-mono uppercase font-bold tracking-wider">
                TV Host Dashboard
              </span>
              <span className="flex items-center gap-1 text-xs text-[#22C55E] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                Lobby Active
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              Welcome to The Lobby
            </h1>
          </div>
        </div>

        {/* Room Code & Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#090A0F] border border-[#1F2430] hover:border-[#3B82F6]/50 transition text-white font-mono cursor-pointer"
            title="Click to copy Room Code"
          >
            <span className="text-xs text-[#94A3B8]">Room:</span>
            <span className="font-bold text-lg tracking-widest text-[#3B82F6]">{roomCode}</span>
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

      {/* Main Grid: Game Selection & Player Roster */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Catalog Selection (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#3B82F6]" /> Choose a Game Mode
            </h2>
            <span className="text-xs text-[#94A3B8]">
              {AVAILABLE_GAMES.filter(g => g.enabled).length} of {AVAILABLE_GAMES.length} available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {AVAILABLE_GAMES.map((game) => {
              const Icon = game.icon;
              return (
                <div
                  key={game.id}
                  onClick={() => game.enabled && handleSelectGame(game.id)}
                  className={`group relative rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between overflow-hidden border ${
                    game.enabled
                      ? `${game.borderColor} bg-[#12141C] hover:bg-[#191C28] cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.01]`
                      : 'border-[#1F2430] bg-[#12141C]/50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {/* Subtle hover gradient */}
                  <div className={`absolute inset-0 transition-colors pointer-events-none ${game.glowColor}`} />

                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#090A0F] border border-[#1F2430] flex items-center justify-center text-white">
                        <Icon className="w-6 h-6" />
                      </div>

                      {game.badge && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider ${
                            game.enabled
                              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                              : 'bg-slate-800 border border-slate-700 text-slate-400'
                          }`}
                        >
                          {game.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-[#3B82F6] transition">
                      {game.name}
                    </h3>
                    <span className="text-xs font-mono text-[#94A3B8] block mb-2">
                      {game.category} • {game.minPlayers}-{game.maxPlayers} Players
                    </span>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      {game.tagline}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-[#1F2430] flex items-center justify-between">
                    {game.enabled ? (
                      <button
                        type="button"
                        disabled={isLaunching}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] group-hover:from-[#2563EB] group-hover:to-[#1D4ED8] font-semibold text-xs text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Launch {game.name}</span>
                      </button>
                    ) : (
                      <div className="w-full py-2.5 px-4 rounded-xl bg-[#090A0F] border border-[#1F2430] text-center text-xs text-[#64748B] flex items-center justify-center gap-1.5 font-mono">
                        <Lock className="w-3.5 h-3.5" /> Coming Soon
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Joined Players Panel (1 Col) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#22C55E]" /> Joined Players
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-xs font-mono font-semibold">
              {players.length} online
            </span>
          </div>

          <div className="rounded-2xl p-5 bg-[#12141C] border border-[#1F2430] flex flex-col gap-3 min-h-[320px] shadow-xl">
            {players.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#64748B]">
                <Users className="w-10 h-10 mb-2 stroke-1 opacity-50" />
                <p className="text-sm font-medium">Waiting for players to join...</p>
                <p className="text-xs text-[#475569] mt-1">
                  Tell players to visit on mobile and enter code <span className="font-mono text-white font-bold">{roomCode}</span>
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
                {players.map((player, index) => (
                  <div
                    key={player.socket_id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#090A0F] border border-[#1F2430] hover:border-[#3B82F6]/30 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#191C28] border border-[#1F2430] flex items-center justify-center text-xs font-mono font-bold text-[#3B82F6]">
                        #{index + 1}
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {player.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-[#22C55E]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                      Ready
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyHost;
