import React from 'react';
import { useCoreStore } from '../store/coreStore';
import { Smartphone, Shield, LogOut, CheckCircle2 } from 'lucide-react';

export const HubLobbyPlayer: React.FC = () => {
  const { roomCode, myPlayerName, players, leaveRoom } = useCoreStore();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 relative z-0 selection:bg-[#3B82F6]/30">
      <div className="w-full max-w-md mx-auto flex flex-col gap-6 my-auto">
        <div className="wope-card p-6 sm:p-8 flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden">
          {/* Radar wave pulse in background */}
          <div className="relative flex items-center justify-center my-4">
            <div className="absolute w-32 h-32 rounded-full bg-[#3B82F6]/10 animate-ping" />
            <div className="absolute w-24 h-24 rounded-full bg-[#3B82F6]/20 animate-pulse" />
            <div className="w-16 h-16 rounded-2xl bg-[#191C28] border border-[#3B82F6]/50 flex items-center justify-center text-[#3B82F6] z-10 shadow-lg">
              <Smartphone className="w-8 h-8" />
            </div>
          </div>

          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected to Hub
            </div>

            <h2 className="text-2xl font-bold text-[#F8FAFC]">
              Waiting for Host
            </h2>
            <p className="text-xs text-[#94A3B8] max-w-xs mx-auto">
              Welcome, <span className="font-semibold text-[#F8FAFC]">{myPlayerName}</span>. The host is currently selecting a game mode on the big screen.
            </p>
          </div>

          {/* Room & Status Info Pill */}
          <div className="w-full grid grid-cols-2 gap-3 pt-4 border-t border-[#1F2430]">
            <div className="p-3 rounded-lg bg-[#090A0F] border border-[#1F2430] text-center">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#94A3B8] block mb-0.5">
                Room
              </span>
              <span className="font-mono font-bold text-lg text-[#3B82F6]">
                {roomCode}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#090A0F] border border-[#1F2430] text-center">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#94A3B8] block mb-0.5">
                Players In
              </span>
              <span className="font-mono font-bold text-lg text-[#22C55E]">
                {players.length}
              </span>
            </div>
          </div>

          {/* Secret Controller Note */}
          <div className="w-full flex items-center gap-2.5 p-3 rounded-lg bg-[#191C28]/60 border border-[#1F2430] text-left">
            <Shield className="w-4 h-4 text-[#3B82F6] shrink-0" />
            <div className="text-[11px] text-[#94A3B8] leading-tight">
              Keep this screen open. Your private role and actions will appear here automatically when the game begins.
            </div>
          </div>

          {/* Leave Lobby Button */}
          <button
            onClick={leaveRoom}
            className="w-full py-2.5 px-4 rounded-xl bg-[#090A0F] hover:bg-[#191C28] border border-[#1F2430] text-[#94A3B8] hover:text-[#EF4444] text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default HubLobbyPlayer;
