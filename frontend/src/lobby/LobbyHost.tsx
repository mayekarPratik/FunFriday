import React, { useState } from 'react';
import QRCode from 'react-qr-code';
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
  Skull,
  QrCode as QrCodeIcon,
  Maximize2,
  X,
  Info
} from 'lucide-react';
import { RulesModal } from '../components/RulesModal';

interface GameHubCard {
  id: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
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
    tagline: 'Deception, secret roles, and night kills.',
    description: 'A treacherous village divided between innocent villagers, special power roles (Seer, Doctor), and hidden Werewolves hunting under the cover of darkness. Uncover lies during day trials before the pack claims total victory.',
    features: ['Secret Night Actions', 'Seer & Doctor Roles', 'Live Village Accusations', 'Real-time Day Trials'],
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
    tagline: 'Classic mobster deception & undercover hits.',
    description: 'The mob controls the streets while undercover investigators and doctors work to dismantle the syndicate. Interrogate suspects, build alliances, and vote out the mobsters in high-stakes public trials.',
    features: ['Syndicate Secret Hits', 'Detective Investigations', 'Doctor Protections', 'Heated Town Debates'],
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
    tagline: 'Pass liberal & fascist policies while uncovering the secret leader.',
    description: 'Political intrigue and deduction where players work to pass critical laws while testing the loyalty of presidential candidates.',
    features: ['Secret Government', 'Policy Enactment', 'Veto Powers'],
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
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [rulesGameType, setRulesGameType] = useState<'werewolf' | 'mafia' | null>(null);

  const joinUrl = typeof window !== 'undefined' && roomCode
    ? `${window.location.origin}/?code=${roomCode}`
    : '';

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
    <div className="w-full flex flex-col gap-4 sm:gap-6 box-border relative px-1 py-1 sm:px-0 sm:py-0">
      {/* Expanded Big QR Code Modal */}
      {isQrModalOpen && joinUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            className="w-full max-w-sm sm:max-w-md p-5 sm:p-8 rounded-3xl bg-[#12141C] border border-[#1F2430] shadow-2xl flex flex-col items-center text-center gap-5 sm:gap-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-[#090A0F] border border-[#1F2430] hover:border-[#EF4444] text-[#94A3B8] hover:text-[#EF4444] flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 mt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] text-xs font-mono uppercase font-bold tracking-wider">
                <QrCodeIcon className="w-3.5 h-3.5" /> Scan on Mobile
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Join The Lobby</h2>
              <p className="text-xs text-[#94A3B8]">Point your phone camera at the QR code below to connect instantly.</p>
            </div>

            {/* High Resolution Big QR Code */}
            <div className="p-3 sm:p-4 bg-white rounded-2xl shadow-2xl shadow-blue-500/10 border-4 border-white max-w-[240px] sm:max-w-[260px] w-full">
              <QRCode
                value={joinUrl}
                size={220}
                level="H"
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              />
            </div>

            {/* Room Code Quick Info Pill */}
            <div className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#090A0F] border border-[#1F2430] gap-2">
              <div className="text-left min-w-0">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#94A3B8] block -mb-0.5">
                  ROOM CODE
                </span>
                <span className="font-mono font-black text-xl sm:text-2xl tracking-[0.2em] sm:tracking-[0.25em] text-[#3B82F6]">
                  {roomCode}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl bg-[#191C28] hover:bg-[#1F2430] border border-[#1F2430] text-xs font-mono text-white transition cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4 text-[#94A3B8]" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Host Header Banner */}
      <div className="w-full shrink-0 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-2xl bg-[#12141C] border border-[#1F2430] shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#191C28] border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] shadow-lg shrink-0">
            <Tv className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] text-[10px] font-mono uppercase font-bold tracking-wider">
                TV Host Dashboard
              </span>
              <span className="flex items-center gap-1 text-xs text-[#22C55E] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                Lobby Active
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white mt-0.5 truncate sm:overflow-visible sm:whitespace-normal">
              Welcome to The Lobby
            </h1>
            <p className="text-xs text-[#94A3B8] mt-0.5 line-clamp-1 sm:line-clamp-none">
              Players can scan the QR code on mobile or type the 4-letter code to join instantly.
            </p>
          </div>
        </div>

        {/* QR Code & Room Code Section */}
        <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 bg-[#090A0F]/90 border border-[#1F2430] p-2 sm:px-4 sm:py-2.5 rounded-2xl shadow-inner w-full md:w-auto">
          {/* Jackbox-style Scan QR Code with Hover Expand + Click to Enlarge */}
          {joinUrl && (
            <div
              onClick={() => setIsQrModalOpen(true)}
              className="group/qr relative flex items-center gap-2 sm:gap-2.5 pr-2 sm:pr-3 border-r border-[#1F2430] cursor-pointer hover:bg-[#12141C] p-1 rounded-xl transition-all"
              title="Click to enlarge QR Code"
            >
              <div className="relative p-1 bg-white rounded-lg shadow shrink-0 transition-transform duration-200 group-hover/qr:scale-110 group-hover/qr:shadow-lg group-hover/qr:shadow-blue-500/20">
                <QRCode
                  value={joinUrl}
                  size={42}
                  level="M"
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/qr:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                  <Maximize2 className="w-3.5 h-3.5 text-white drop-shadow-md" />
                </div>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#3B82F6] font-bold flex items-center gap-1 group-hover/qr:text-blue-400">
                  <QrCodeIcon className="w-3 h-3" /> SCAN TO JOIN
                </span>
                <span className="text-[9px] text-[#94A3B8] max-w-[85px] leading-tight group-hover/qr:text-white transition-colors">
                  Click to enlarge
                </span>
              </div>
            </div>
          )}

          {/* Room Code & Copy */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#12141C] border border-[#1F2430] hover:border-[#3B82F6]/50 transition text-white font-mono cursor-pointer"
              title="Click to copy Room Code"
            >
              <div className="text-left">
                <span className="text-[8px] uppercase font-mono tracking-widest text-[#94A3B8] block -mb-0.5">
                  ROOM
                </span>
                <span className="font-bold text-base sm:text-lg tracking-[0.15em] text-[#3B82F6]">{roomCode}</span>
              </div>
              {copied ? <Check className="w-3.5 h-3.5 text-[#22C55E] ml-0.5" /> : <Copy className="w-3.5 h-3.5 text-[#94A3B8] ml-0.5" />}
            </button>

            <button
              onClick={leaveRoom}
              className="p-2 sm:p-2.5 rounded-xl bg-[#12141C] border border-[#1F2430] hover:border-[#EF4444]/50 text-[#94A3B8] hover:text-[#EF4444] transition cursor-pointer shrink-0"
              title="Leave Lobby"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Game Selection & Player Roster */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Game Catalog Selection (2 Cols on lg) */}
        <div className="lg:col-span-2 flex flex-col gap-3 w-full">
          <div className="flex items-center justify-between shrink-0 px-0.5">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#3B82F6]" /> Choose a Game Mode
            </h2>
            <span className="text-xs text-[#94A3B8]">
              {AVAILABLE_GAMES.filter(g => g.enabled).length} of {AVAILABLE_GAMES.length} available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {AVAILABLE_GAMES.filter(g => g.enabled).map((game) => {
              const Icon = game.icon;
              return (
                <div
                  key={game.id}
                  onClick={() => game.enabled && handleSelectGame(game.id)}
                  className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between overflow-hidden border w-full min-h-[320px] ${
                    game.enabled
                      ? `${game.borderColor} bg-[#12141C] hover:bg-[#151824] cursor-pointer shadow-lg hover:shadow-2xl`
                      : 'border-[#1F2430] bg-[#12141C]/50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {/* Subtle hover gradient */}
                  <div className={`absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 group-hover:opacity-100 ${game.glowColor}`} />

                  <div className="relative z-10 flex flex-col gap-2.5 w-full">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#090A0F] border border-[#1F2430] flex items-center justify-center text-white shadow-inner group-hover:border-[#3B82F6]/40 transition shrink-0">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {(game.id === 'werewolf' || game.id === 'mafia') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRulesGameType(game.id as 'werewolf' | 'mafia');
                            }}
                            className="w-7 h-7 rounded-full bg-[#090A0F]/90 border border-[#1F2430] hover:border-[#3B82F6] text-[#94A3B8] hover:text-white flex items-center justify-center transition cursor-pointer shadow-sm hover:scale-105"
                            title={`How to Play ${game.name}`}
                            aria-label={`How to play ${game.name} rules`}
                          >
                            <Info className="w-3.5 h-3.5 text-[#3B82F6]" />
                          </button>
                        )}

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
                    </div>

                    <div className="min-w-0 w-full">
                      <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#3B82F6] transition break-words">
                        {game.name}
                      </h3>
                      <span className="text-xs font-mono text-[#3B82F6] font-medium block break-words mt-0.5">
                        {game.category} • {game.minPlayers}-{game.maxPlayers} Players
                      </span>
                    </div>

                    <p className="text-xs text-[#CBD5E1] leading-relaxed break-words whitespace-normal">
                      {game.description}
                    </p>

                    {game.features && game.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {game.features.map((feat) => (
                          <span
                            key={feat}
                            className="px-2 py-0.5 rounded-md bg-[#090A0F]/80 border border-[#1F2430] text-[10px] font-medium text-[#94A3B8] group-hover:border-[#3B82F6]/30 group-hover:text-slate-200 transition break-words"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 pt-3 sm:pt-4 mt-3 border-t border-[#1F2430] flex items-center justify-between w-full">
                    {game.enabled ? (
                      <button
                        type="button"
                        disabled={isLaunching}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] font-semibold text-xs text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Launch {game.name}</span>
                      </button>
                    ) : (
                      <div className="w-full py-2 px-4 rounded-xl bg-[#090A0F] border border-[#1F2430] text-center text-xs text-[#64748B] flex items-center justify-center gap-1.5 font-mono">
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
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center justify-between shrink-0 px-0.5">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#22C55E]" /> Joined Players
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-xs font-mono font-semibold">
              {players.length} online
            </span>
          </div>

          <div className="rounded-2xl p-4 sm:p-5 bg-[#12141C] border border-[#1F2430] flex flex-col gap-3 min-h-[160px] sm:min-h-0 flex-1 shadow-xl overflow-hidden w-full">
            {players.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-6 text-[#64748B]">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 mb-2 stroke-1 opacity-50" />
                <p className="text-sm font-medium">Waiting for players to join...</p>
                <p className="text-xs text-[#475569] mt-1 break-words max-w-xs">
                  Tell players to visit on mobile and enter code <span className="font-mono text-white font-bold">{roomCode}</span>
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1.5 custom-scrollbar max-h-[260px] lg:max-h-none">
                {players.map((player, index) => (
                  <div
                    key={player.socket_id}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#090A0F] border border-[#1F2430] hover:border-[#3B82F6]/30 transition w-full"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#191C28] border border-[#1F2430] flex items-center justify-center text-xs font-mono font-bold text-[#3B82F6] shrink-0">
                        #{index + 1}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-white truncate">
                        {player.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-[#22C55E] shrink-0">
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

      {/* Rules Guide Modal */}
      <RulesModal
        isOpen={rulesGameType !== null}
        onClose={() => setRulesGameType(null)}
        gameType={rulesGameType || 'werewolf'}
      />
    </div>
  );
};

export default LobbyHost;
