import React, { useState, useEffect, useRef } from 'react';
import { useCoreStore } from '../store/coreStore';
import {
  Smartphone,
  Tv,
  LogIn,
  RefreshCw,
  KeyRound,
  User,
  Sparkles,
  Monitor,
  Shield,
  Play,
  AlertCircle
} from 'lucide-react';

const FLAVOR_TEXTS = [
  'Trust no one.',
  'The village is sleeping...',
  'Prepare to lie.',
  'Who is the wolf?',
  'Deception loading...'
];

export const LandingPage: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    createRoom,
    joinRoom,
    lastActionError,
    clearErrors
  } = useCoreStore();

  const [mode, setMode] = useState<'join' | 'host'>('join');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Rotating Flavor Text
  const [flavorIndex, setFlavorIndex] = useState(0);
  const [fadeState, setFadeState] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState(false);
      setTimeout(() => {
        setFlavorIndex((prev) => (prev + 1) % FLAVOR_TEXTS.length);
        setFadeState(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 3D Card Parallax Tilt (Desktop only)
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardTransform, setCardTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Skip on touch/mobile
    if (window.innerWidth < 1024) return;

    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Subtle 3-5 degree tilt
    const rotateY = ((clientX - centerX) / centerX) * 4;
    const rotateX = -((clientY - centerY) / centerY) * 4;

    setCardTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`);
  };

  const handleMouseLeave = () => {
    setCardTransform('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearErrors();

    const rawCode = roomCode.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!rawCode) {
      setLocalError('Please enter a 4-letter Room Code');
      return;
    }
    if (rawCode.length !== 4) {
      setLocalError('Room code must be exactly 4 characters');
      return;
    }
    if (!trimmedName) {
      setLocalError('Please enter your nickname');
      return;
    }
    if (trimmedName.length > 12) {
      setLocalError('Player name must be 12 characters or less');
      return;
    }

    setLoading(true);
    const res = await joinRoom({
      room_code: rawCode,
      name: trimmedName
    });
    setLoading(false);

    if (!res.success) {
      setLocalError(res.error || 'Failed to join room. Please check the code.');
    }
  };

  const handleHost = async () => {
    setLocalError(null);
    clearErrors();
    setLoading(true);
    const res = await createRoom();
    setLoading(false);

    if (!res.success) {
      setLocalError(res.error || 'Failed to create room. Please try again.');
    }
  };

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    setRoomCode(val);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-between items-center px-4 py-8 relative z-0 selection:bg-[#3B82F6]/30 overflow-x-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Top Header Logo */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#12141C] border border-[#1F2430] flex items-center justify-center text-[#3B82F6] shadow-lg shadow-[#3B82F6]/5">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-black tracking-widest text-base uppercase bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              FunFriday
            </span>
            <span className="text-[10px] font-mono tracking-wider uppercase text-[#3B82F6] font-semibold -mt-1">
              Multiplayer Game Hub
            </span>
          </div>
        </div>

        {/* Global Connection Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1F2430] bg-[#12141C]/80 backdrop-blur-md text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? 'bg-[#22C55E] shadow-sm shadow-[#22C55E]/50 animate-pulse'
                : isConnecting
                ? 'bg-[#EAB308] animate-ping'
                : 'bg-[#EF4444]'
            }`}
          />
          <span className="text-[#94A3B8]">
            {isConnected ? 'Server Online' : isConnecting ? 'Connecting...' : 'Offline'}
          </span>
        </div>
      </header>

      {/* Hero & Action Card Container */}
      <main className="w-full max-w-md my-auto flex flex-col items-center gap-8 z-10 pt-4">
        {/* Hero Title & Rotating Subtitle */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Social Deduction
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-sm">
            WEREWOLF & HUB
          </h1>

          <div className="h-6 flex items-center justify-center">
            <p
              className={`text-sm sm:text-base font-serif italic text-[#94A3B8] transition-opacity duration-300 ${
                fadeState ? 'opacity-100' : 'opacity-0'
              }`}
            >
              "{FLAVOR_TEXTS[flavorIndex]}"
            </p>
          </div>
        </div>

        {/* Parallax Interactive Card */}
        <div
          ref={cardRef}
          style={{
            transform: cardTransform,
            transition: 'transform 0.15s ease-out'
          }}
          className="w-full bg-[#12141C] border border-[#1F2430] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 flex flex-col gap-6 relative overflow-hidden backdrop-blur-xl"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#6366F1]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Tab Switcher: Join as Player / Host on TV */}
          <div className="grid grid-cols-2 p-1 bg-[#090A0F] rounded-xl border border-[#1F2430]">
            <button
              type="button"
              onClick={() => {
                setMode('join');
                setLocalError(null);
                clearErrors();
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                mode === 'join'
                  ? 'bg-[#191C28] text-white shadow-md border border-[#1F2430]'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4 text-[#3B82F6]" />
              <span>Join Game</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('host');
                setLocalError(null);
                clearErrors();
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                mode === 'host'
                  ? 'bg-[#191C28] text-white shadow-md border border-[#1F2430]'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Tv className="w-4 h-4 text-[#3B82F6]" />
              <span>Host on TV</span>
            </button>
          </div>

          {/* Error Message Display */}
          {(localError || lastActionError) && (
            <div className="p-3.5 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 text-xs text-[#EF4444] flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{localError || lastActionError}</span>
            </div>
          )}

          {/* MODE: JOIN GAME (Player) */}
          {mode === 'join' && (
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              {/* Room Code Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#3B82F6]" /> Room Code
                  </span>
                  <span className="text-[10px] text-[#64748B]">4 letters</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={handleRoomCodeChange}
                    placeholder="WOLF"
                    maxLength={4}
                    autoComplete="off"
                    autoCapitalize="characters"
                    className="w-full bg-[#090A0F] border border-[#1F2430] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] rounded-xl py-3.5 px-4 text-center font-mono font-bold text-2xl tracking-[0.3em] uppercase text-white placeholder:text-[#334155] outline-none transition"
                  />
                </div>
              </div>

              {/* Player Nickname Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#3B82F6]" /> Your Nickname
                  </span>
                  <span className="text-[10px] text-[#64748B]">{name.length}/12</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 12))}
                  placeholder="e.g. Sherlock"
                  maxLength={12}
                  autoComplete="off"
                  className="w-full bg-[#090A0F] border border-[#1F2430] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] rounded-xl py-3 px-4 text-sm font-medium text-white placeholder:text-[#334155] outline-none transition"
                />
              </div>

              {/* Submit Join Button */}
              <button
                type="submit"
                disabled={loading || !isConnected}
                className="mt-2 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-white shadow-lg shadow-[#3B82F6]/25 hover:shadow-[#3B82F6]/40 transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Entering Room...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Enter Lobby</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE: HOST ON TV (Big Screen Host) */}
          {mode === 'host' && (
            <div className="flex flex-col gap-5 text-center">
              <div className="p-4 rounded-xl bg-[#090A0F] border border-[#1F2430] flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#191C28] border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] shadow-md">
                  <Monitor className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Display on Big Screen / TV</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Create a lobby as the Room Host. Broadcast day timers, night recaps, and live voting results on your TV screen while players join from mobile phones.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleHost}
                disabled={loading || !isConnected}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-white shadow-lg shadow-[#3B82F6]/25 hover:shadow-[#3B82F6]/40 transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Room...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Create Host Room</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl flex items-center justify-between text-xs text-[#94A3B8] border-t border-[#1F2430] pt-4 z-10">
        <span>FunFriday Game Hub • Social Deduction Suite</span>
        <span>Created by Pratik Mayekar</span>
      </footer>
    </div>
  );
};

export default LandingPage;
