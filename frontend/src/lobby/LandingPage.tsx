import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
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
  const [roomCode, setRoomCodeState] = useState('');
  const [isQrScanned, setIsQrScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Check URL query parameters for Jackbox QR Code join (?code=XXXX)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code') || params.get('room');
    if (codeParam) {
      const sanitized = codeParam.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
      if (sanitized.length === 4) {
        setRoomCodeState(sanitized);
        setMode('join');
        setIsQrScanned(true);

        // Clean up the URL in address bar without reloading
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

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
      const err = 'Please enter a 4-letter Room Code';
      setLocalError(err);
      toast.error(err);
      return;
    }
    if (rawCode.length !== 4) {
      const err = 'Room code must be exactly 4 characters';
      setLocalError(err);
      toast.error(err);
      return;
    }
    if (!trimmedName) {
      const err = 'Please enter your nickname';
      setLocalError(err);
      toast.error(err);
      return;
    }
    if (trimmedName.length > 12) {
      const err = 'Player name must be 12 characters or less';
      setLocalError(err);
      toast.error(err);
      return;
    }

    setLoading(true);
    const res = await joinRoom({
      room_code: rawCode,
      name: trimmedName
    });
    setLoading(false);

    if (!res.success) {
      const errMsg = res.error || 'Failed to join room. Please check the code.';
      setLocalError(errMsg);
      toast.error(errMsg, { id: 'join_error' });
    }
  };

  const handleHost = async () => {
    setLocalError(null);
    clearErrors();
    setLoading(true);
    const res = await createRoom();
    setLoading(false);

    if (!res.success) {
      const errMsg = res.error || 'Failed to create room. Please try again.';
      setLocalError(errMsg);
      toast.error(errMsg, { id: 'host_error' });
    }
  };

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    setRoomCodeState(val);
  };

  return (
    <div
      className="relative z-10 w-full h-full max-h-full grid grid-cols-1 lg:grid-cols-2 selection:bg-[#3B82F6]/30 overflow-hidden box-border"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Left Column: Reserved for Interactive Constellation Canvas */}
      <div className="hidden lg:block w-full h-full pointer-events-none" />

      {/* Right Column: Master Wrapper Container */}
      <div className="flex-1 flex flex-col justify-center items-start w-full max-w-[440px] mx-auto h-full max-h-full px-4 sm:px-6 lg:px-0 py-2 sm:py-6 overflow-y-auto lg:overflow-visible box-border">
        {/* Badges Row: Next-Gen Pill & Server Online Badge */}
        <div className="flex flex-row items-center justify-between w-full mb-4 sm:mb-6 gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Next-Gen Social Deduction</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[#1F2430] bg-[#12141C]/80 backdrop-blur-md text-xs font-mono shadow-sm">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
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
        </div>

        {/* Hero Block (Stacked & Left-aligned with whitespace-nowrap) */}
        <div className="flex flex-col items-start gap-2 mb-8 w-full">
          <h1 className="font-['Montserrat'] text-4xl lg:text-5xl font-black text-white tracking-[0.2em] uppercase whitespace-nowrap drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] select-none leading-none">
            The Lobby
          </h1>

          <p className="font-['Space_Mono'] text-xs text-gray-400 tracking-[0.3em] uppercase">
            MULTIPLAYER GAME HUB
          </p>

          <div className="h-5 flex items-center mt-1">
            <p
              className={`text-sm font-serif italic text-[#94A3B8] transition-opacity duration-300 ${
                fadeState ? 'opacity-100' : 'opacity-0'
              }`}
            >
              "{FLAVOR_TEXTS[flavorIndex]}"
            </p>
          </div>
        </div>

        {/* Parallax Interactive Frosted Glass Card (w-full) */}
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
              {/* Room Code: Auto-locked Pill when QR is scanned, or editable input */}
              {isQrScanned ? (
                <div className="p-3.5 rounded-xl bg-[#090A0F] border border-[#3B82F6]/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6]">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#3B82F6] font-bold block">
                        QR Code Scanned
                      </span>
                      <span className="text-xs text-[#94A3B8]">
                        Joining Room: <strong className="font-mono text-white tracking-widest text-sm">{roomCode}</strong>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsQrScanned(false)}
                    className="text-[10px] font-mono text-[#94A3B8] hover:text-white underline cursor-pointer"
                  >
                    Change Code
                  </button>
                </div>
              ) : (
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
              )}

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
                  autoFocus={isQrScanned}
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

        {/* Footer */}
        <footer className="w-full flex items-center justify-between text-[11px] text-[#64748B] pt-6">
          <span>The Lobby • Multiplayer Game Hub</span>
          <span>Created by Pratik Mayekar</span>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;

