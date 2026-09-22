import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useGameStore } from '../store/gameStore';
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
  Play
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
    clearErrors
  } = useGameStore();

  const [mode, setMode] = useState<'join' | 'host'>('join');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

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
    clearErrors();

    const trimmedName = name.trim();
    const rawCode = roomCode.replace(/-/g, '').trim().toUpperCase();

    if (!rawCode || rawCode.length !== 4) {
      toast.error('Room code must be 4 letters/numbers');
      return;
    }

    if (!trimmedName) {
      toast.error('Please enter your player name');
      return;
    }

    if (trimmedName.length > 12) {
      toast.error('Player name must be 12 characters or less');
      return;
    }

    setLoading(true);
    const res = await joinRoom({
      room_code: rawCode,
      name: trimmedName
    });
    setLoading(false);

    if (!res.success) {
      toast.error(res.error || 'Failed to join room. Please check the code.');
    }
  };

  const handleHost = async () => {
    clearErrors();
    setLoading(true);
    const res = await createRoom();
    setLoading(false);

    if (!res.success) {
      toast.error(res.error || 'Failed to create room. Please try again.');
    }
  };

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const cleanValue = rawValue.slice(0, 4);
    setRoomCode(cleanValue);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="flex-1 w-full h-full flex items-center justify-center lg:justify-end lg:pr-32 px-4 py-8 select-none relative z-0 overflow-hidden box-border"
    >
      {/* Master Frosted Glass Card - Matching Host Dashboard */}
      <div
        ref={cardRef}
        style={{ transform: cardTransform }}
        className="w-full max-w-md p-8 bg-gray-900/80 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-xl relative flex flex-col items-center text-center transition-transform duration-200 ease-out"
      >
        {/* Server Uplink Status Indicator (Top Right) */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/5 backdrop-blur-sm">
          {isConnected ? (
            <>
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] text-green-500/80 uppercase tracking-widest font-mono">
                Uplink Active
              </span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2 mr-1">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 animate-pulse"></span>
              </span>
              <span className="text-[10px] text-red-400 uppercase tracking-widest font-mono">
                Connection Lost
              </span>
            </>
          )}
        </div>

        {/* Subtle interior glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#3B82F6]/15 blur-3xl rounded-full pointer-events-none -z-10" />

        {/* Title & Moon Icon Flex Container */}
        <div className="w-full flex items-center justify-center lg:justify-start gap-4 mb-2 mt-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10 text-white animate-moon-breathe shrink-0"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
          <h1 className="text-4xl font-extrabold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] tracking-tight text-left">
            FunFriday Games
          </h1>
        </div>

        {/* Rotating Dynamic Subtitle - Centered */}
        <div className="w-full h-6 mb-6 flex items-center justify-center text-center">
          <p
            className={`text-sm text-gray-400 font-medium tracking-wide transition-opacity duration-500 ${fadeState ? 'opacity-100' : 'opacity-0'
              }`}
          >
            {FLAVOR_TEXTS[flavorIndex]}
          </p>
        </div>

        {/* Sleek Segmented Pill Toggle */}
        <div className="flex p-1 bg-gray-900/90 rounded-full border border-gray-800 backdrop-blur-md mb-6 w-full max-w-xs shadow-inner">
          <button
            type="button"
            onClick={() => {
              setMode('join');
              clearErrors();
            }}
            className={`flex-1 py-2 px-4 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${mode === 'join'
              ? 'bg-gray-700 text-white shadow'
              : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Join Game</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('host');
              clearErrors();
            }}
            className={`flex-1 py-2 px-4 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${mode === 'host'
              ? 'bg-gray-700 text-white shadow'
              : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Host Game</span>
          </button>
        </div>

        {/* Dynamic Form Content */}
        <div className="w-full">
          {mode === 'join' ? (
            /* JOIN GAME FORM */
            <form onSubmit={handleJoin} className="space-y-4">
              {/* Room Code */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#3B82F6]" /> Room Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={7}
                    value={roomCode ? roomCode.split('').join('-') : ''}
                    onChange={handleRoomCodeChange}
                    className="w-full h-12 px-4 text-center tracking-[0.25em] font-mono text-xl uppercase font-bold text-white bg-gray-800/50 border border-gray-700 focus:border-blue-500 rounded-lg focus:outline-none transition"
                    required
                    autoFocus
                  />
                  {!roomCode && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-600 select-none">
                      <span className="text-xs font-normal font-sans tracking-normal lowercase opacity-80 mr-2">
                        e.g.
                      </span>
                      <span className="font-mono font-bold text-xl tracking-[0.25em] uppercase">
                        W-O-L-F
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Player Name */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#3B82F6]" /> Player Name
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value.slice(0, 12));
                  }}
                  placeholder="Your nickname (max 12 chars)"
                  className="w-full h-12 px-4 rounded-lg bg-gray-800/50 border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500 transition placeholder:text-gray-600"
                  required
                />
              </div>

              {/* Connect Button */}
              <button
                type="submit"
                disabled={!isConnected || loading || isConnecting || !roomCode.trim() || !name.trim()}
                className="wope-btn-primary w-full h-12 text-sm font-semibold flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#3B82F6]/25 hover:shadow-[#3B82F6]/40 transition"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Connect</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* HOST GAME VIEW */
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900/80 border border-white/10 flex items-center justify-center text-[#3B82F6] shadow-inner">
                <Tv className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] text-[11px] font-mono uppercase font-semibold">
                  <Sparkles className="w-3 h-3" /> Host Display Mode
                </div>
                <h2 className="text-xl font-bold text-white">
                  Create a Game Room
                </h2>
                <p className="text-gray-400 text-sm text-center max-w-xs mx-auto">
                  Create a new room. Display this screen on a TV or tablet for everyone to see.
                </p>
              </div>

              {/* Generate New Room Button */}
              <button
                type="button"
                onClick={handleHost}
                disabled={!isConnected || loading || isConnecting}
                className="wope-btn-primary w-full h-12 text-sm font-semibold flex items-center justify-center gap-2.5 shadow-lg shadow-[#3B82F6]/25 hover:shadow-[#3B82F6]/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating Room Code...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Generate New Room</span>
                  </>
                )}
              </button>

              {/* Feature info footer */}
              <div className="grid grid-cols-2 gap-2.5 w-full pt-3 border-t border-white/10 text-left">
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <Monitor className="w-3.5 h-3.5 text-[#3B82F6] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-white">Public Display</p>
                    <p className="text-[10px] text-gray-400">Live timers & recaps</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <Shield className="w-3.5 h-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-white">Zero Leaks</p>
                    <p className="text-[10px] text-gray-400">Private roles</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card Bottom Attribution */}
        <div className="w-full pt-6 mt-2 border-t border-white/5 text-center">
          <p className="text-[11px] font-mono text-gray-500 tracking-wide">
            A Multiplayer Party Game • Created by Pratik Mayekar
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
