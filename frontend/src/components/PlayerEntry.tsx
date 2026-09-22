import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Smartphone, LogIn, RefreshCw, KeyRound, User } from 'lucide-react';

interface PlayerEntryProps {
  onSwitchToHost: () => void;
}

export const PlayerEntry: React.FC<PlayerEntryProps> = ({ onSwitchToHost }) => {
  const { isConnected, isConnecting, joinRoom, clearErrors } = useGameStore();

  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !name.trim()) return;

    setLoading(true);
    clearErrors();
    await joinRoom({
      room_code: roomCode.trim().toUpperCase(),
      name: name.trim()
    });
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      {/* Player Card */}
      <div className="wope-card p-6 sm:p-8 flex flex-col shadow-2xl relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#191C28] border border-[#1F2430] flex items-center justify-center text-[#3B82F6]">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F8FAFC]">Join Game</h2>
            <p className="text-xs text-[#94A3B8]">Enter room credentials to enter the lobby</p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          {/* Room Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#3B82F6]" /> Room Code
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={7}
                value={roomCode ? roomCode.split('').join('-') : ''}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
                  const cleanValue = rawValue.slice(0, 4);
                  setRoomCode(cleanValue);
                }}
                className="w-full h-12 px-4 rounded-lg bg-[#090A0F] border border-[#1F2430] text-[#F8FAFC] font-mono tracking-widest text-center text-lg font-bold uppercase focus:outline-none focus:border-[#3B82F6] transition"
                required
                autoFocus
              />
              {!roomCode && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[#94A3B8]/40 select-none">
                  <span className="text-xs font-normal font-sans tracking-normal lowercase opacity-80 mr-2">
                    e.g.
                  </span>
                  <span className="font-mono font-bold text-lg tracking-widest uppercase">
                    W-O-L-F
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Player Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#3B82F6]" /> Player Name
            </label>
            <input
              type="text"
              maxLength={18}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your nickname"
              className="w-full h-12 px-4 rounded-lg bg-[#090A0F] border border-[#1F2430] text-[#F8FAFC] text-sm focus:outline-none focus:border-[#3B82F6] transition placeholder:text-[#94A3B8]/40"
              required
            />
          </div>

          {/* Join Button */}
          <button
            type="submit"
            disabled={!isConnected || loading || isConnecting || !roomCode.trim() || !name.trim()}
            className="wope-btn-primary w-full h-12 text-sm font-semibold flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#3B82F6]/20 transition"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Entering Room...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Join Game</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Switch to Host View */}
      <div className="text-center">
        <button
          onClick={onSwitchToHost}
          className="wope-btn-secondary px-4 py-2 text-xs font-medium inline-flex items-center gap-2 cursor-pointer"
        >
          Want to host a new game on this device? Switch to Host View →
        </button>
      </div>
    </div>
  );
};
