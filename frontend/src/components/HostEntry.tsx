import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Tv, Play, RefreshCw, Sparkles, Monitor, Shield } from 'lucide-react';

interface HostEntryProps {
  onSwitchToPlayer: () => void;
}

export const HostEntry: React.FC<HostEntryProps> = ({ onSwitchToPlayer }) => {
  const { isConnected, isConnecting, createRoom, clearErrors } = useGameStore();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    clearErrors();
    await createRoom();
    setLoading(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
      {/* Hero Card */}
      <div className="wope-card p-8 sm:p-10 flex flex-col items-center text-center relative overflow-hidden shadow-2xl">
        {/* Glow accent in top background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#3B82F6]/10 blur-3xl rounded-full pointer-events-none" />

        <div className="w-14 h-14 rounded-2xl bg-[#191C28] border border-[#1F2430] flex items-center justify-center text-[#3B82F6] mb-6 shadow-inner">
          <Tv className="w-7 h-7" />
        </div>

        <div className="space-y-2 mb-8 z-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] text-xs font-mono uppercase font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Host Display Mode
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F8FAFC]">
            Create a Game Room
          </h1>
          <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
            Host a live social deduction session. Stream this screen on a TV, projector, or share via video call.
          </p>
        </div>

        {/* Create Game Button */}
        <button
          onClick={handleCreate}
          disabled={!isConnected || loading || isConnecting}
          className="wope-btn-primary w-full h-14 text-base font-semibold flex items-center justify-center gap-3 shadow-lg shadow-[#3B82F6]/25 hover:shadow-[#3B82F6]/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Generating Room Code...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Create Game</span>
            </>
          )}
        </button>

        {/* Feature highlight list */}
        <div className="grid grid-cols-2 gap-3 w-full mt-8 pt-8 border-t border-[#1F2430] text-left">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#090A0F]/60 border border-[#1F2430]">
            <Monitor className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-[#F8FAFC]">Public Scoreboard</p>
              <p className="text-[11px] text-[#94A3B8]">Timer & Narration engine</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#090A0F]/60 border border-[#1F2430]">
            <Shield className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-[#F8FAFC]">Zero Secret Leaks</p>
              <p className="text-[11px] text-[#94A3B8]">Safe for big displays</p>
            </div>
          </div>
        </div>
      </div>

      {/* Switch to Player View */}
      <div className="text-center">
        <button
          onClick={onSwitchToPlayer}
          className="wope-btn-secondary px-4 py-2 text-xs font-medium inline-flex items-center gap-2 cursor-pointer"
        >
          Joining from your phone? Switch to Player View →
        </button>
      </div>
    </div>
  );
};
