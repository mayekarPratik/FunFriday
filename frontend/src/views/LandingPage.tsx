import React, { useState } from 'react';
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
  Play,
  Flame,
  Radio,
  AlertCircle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    createRoom,
    joinRoom,
    lastActionError,
    clearErrors
  } = useGameStore();

  const [mode, setMode] = useState<'join' | 'host'>('join');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearErrors();

    const trimmedName = name.trim();
    const cleanCode = roomCode.trim().toUpperCase();

    if (!cleanCode || cleanCode.length !== 4) {
      setLocalError('Room code must be 4 letters');
      return;
    }

    if (!trimmedName) {
      setLocalError('Please enter your player name');
      return;
    }

    if (trimmedName.length > 12) {
      setLocalError('Player name must be 12 characters or less');
      return;
    }

    setLoading(true);
    const res = await joinRoom({
      room_code: cleanCode,
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

  return (
    <div className="min-h-screen w-full bg-[#090A0F] text-[#F8FAFC] flex flex-col justify-between p-4 sm:p-8 select-none relative overflow-hidden">
      {/* Background Ambience / Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#3B82F6]/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Top Header Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#12141C] border border-[#1F2430] text-xs font-mono text-[#94A3B8]">
          <Radio className="w-3.5 h-3.5 text-[#3B82F6] animate-pulse" />
          <span>REALTIME ENGINE</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#12141C] border border-[#1F2430] text-xs font-mono text-[#94A3B8]">
          <Shield className="w-3.5 h-3.5 text-[#22C55E]" />
          <span>OLED EDITION</span>
        </div>
      </header>

      {/* Center Hero Card */}
      <main className="w-full max-w-lg mx-auto my-auto flex flex-col items-center">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#12141C] border border-[#1F2430] flex items-center justify-center text-[#3B82F6] mb-4 shadow-xl relative group">
            <Flame className="w-8 h-8 text-[#3B82F6] group-hover:scale-110 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#3B82F6] text-white text-[9px] font-mono font-bold uppercase tracking-wider">
              LIVE
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F8FAFC]">
            FunFriday Games
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1.5">
            A Multiplayer Party Game • Created by Pratik Mayekar
          </p>
        </div>

        {/* Sleek Segmented Pill Toggle */}
        <div className="flex p-1 bg-gray-900/90 rounded-full border border-gray-800 backdrop-blur-md mb-6 w-full max-w-xs shadow-inner">
          <button
            type="button"
            onClick={() => {
              setMode('join');
              setLocalError(null);
              clearErrors();
            }}
            className={`flex-1 py-2 px-4 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'join'
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
              setLocalError(null);
              clearErrors();
            }}
            className={`flex-1 py-2 px-4 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'host'
                ? 'bg-gray-700 text-white shadow'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Host Game</span>
          </button>
        </div>

        {/* Error Notification */}
        {(localError || lastActionError) && (
          <div className="w-full mb-4 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-xs flex items-start gap-2.5 text-red-400 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 text-left font-medium">
              {localError || lastActionError}
            </div>
          </div>
        )}

        {/* Dynamic Card for Mode */}
        <div className="wope-card w-full p-6 sm:p-8 flex flex-col shadow-2xl relative overflow-hidden backdrop-blur-xl bg-[#12141C]/90 border-[#1F2430]">
          {/* Subtle card glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#3B82F6]/10 blur-2xl rounded-full pointer-events-none" />

          {mode === 'join' ? (
            /* JOIN GAME FORM */
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#191C28] border border-[#1F2430] flex items-center justify-center text-[#3B82F6]">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-bold text-[#F8FAFC]">Join Game</h2>
                  <p className="text-xs text-[#94A3B8]">Enter credentials to join on your device</p>
                </div>
              </div>

              {/* Room Code */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#3B82F6]" /> Room Code
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={roomCode}
                  onChange={(e) => {
                    setLocalError(null);
                    setRoomCode(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4));
                  }}
                  placeholder="4-LETTER CODE"
                  className="w-full h-12 px-4 rounded-lg bg-[#090A0F] border border-[#1F2430] text-[#F8FAFC] font-mono tracking-widest text-center text-lg font-bold uppercase placeholder:text-[#94A3B8]/30 focus:outline-none focus:border-[#3B82F6] transition"
                  required
                  autoFocus
                />
              </div>

              {/* Player Name */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#3B82F6]" /> Player Name
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={name}
                  onChange={(e) => {
                    setLocalError(null);
                    setName(e.target.value.slice(0, 12));
                  }}
                  placeholder="Your nickname (max 12 chars)"
                  className="w-full h-12 px-4 rounded-lg bg-[#090A0F] border border-[#1F2430] text-[#F8FAFC] text-sm focus:outline-none focus:border-[#3B82F6] transition placeholder:text-[#94A3B8]/30"
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
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-[#191C28] border border-[#1F2430] flex items-center justify-center text-[#3B82F6] shadow-inner">
                <Tv className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] text-xs font-mono uppercase font-semibold">
                  <Sparkles className="w-3.5 h-3.5" /> Host Display Mode
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#F8FAFC]">
                  Create a Game Room
                </h2>
                <p className="text-gray-400 text-sm text-center max-w-sm mx-auto">
                  Create a new room. Display this screen on a TV or tablet for everyone to see.
                </p>
              </div>

              {/* Generate New Room Button */}
              <button
                type="button"
                onClick={handleHost}
                disabled={!isConnected || loading || isConnecting}
                className="wope-btn-primary w-full h-13 text-sm font-semibold flex items-center justify-center gap-2.5 shadow-lg shadow-[#3B82F6]/25 hover:shadow-[#3B82F6]/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
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
              <div className="grid grid-cols-2 gap-3 w-full pt-4 border-t border-[#1F2430] text-left">
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#090A0F]/60 border border-[#1F2430]">
                  <Monitor className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-[#F8FAFC]">Public Display</p>
                    <p className="text-[11px] text-[#94A3B8]">Timer & Live Recaps</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#090A0F]/60 border border-[#1F2430]">
                  <Shield className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-[#F8FAFC]">Zero Secret Leaks</p>
                    <p className="text-[11px] text-[#94A3B8]">Private role actions</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto py-4 text-center text-xs text-[#94A3B8]">
        <span>A Multiplayer Party Game • Created by Pratik Mayekar</span>
      </footer>
    </div>
  );
};

export default LandingPage;
