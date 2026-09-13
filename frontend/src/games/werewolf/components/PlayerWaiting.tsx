import React from 'react';
import { useWerewolfStore } from '../werewolfStore';
import { useCoreStore } from '../../../store/coreStore';
import { Smartphone, Shield, LogOut, CheckCircle2 } from 'lucide-react';

export const PlayerWaiting: React.FC = () => {
  const { gameState } = useWerewolfStore();
  const { roomCode, myPlayerName, leaveRoom } = useCoreStore();

  const displayRoomCode = roomCode || gameState?.room_code;
  const playerCount = gameState?.players?.length || 1;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 relative z-0 selection:bg-[#3B82F6]/30">
      <div className="w-full max-w-md mx-auto flex flex-col gap-6 my-auto">
        {/* Player Connected Card */}
        <div className="wope-card p-6 sm:p-8 flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden">
          {/* Radar wave pulse in background */}
          <div className="relative flex items-center justify-center my-4">
            <div className="absolute w-32 h-32 rounded-full bg-red-500/10 animate-ping" />
            <div className="absolute w-24 h-24 rounded-full bg-red-500/20 animate-pulse" />
            <div className="w-16 h-16 rounded-2xl bg-[#191C28] border border-red-500/50 flex items-center justify-center text-red-400 z-10 shadow-lg">
              <Smartphone className="w-8 h-8" />
            </div>
          </div>

          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> In Werewolf Lobby
            </div>

            <h2 className="text-2xl font-bold text-[#F8FAFC]">
              Waiting for Host
            </h2>
            <p className="text-xs text-[#94A3B8] max-w-xs mx-auto">
              Sit tight, <span className="font-semibold text-[#F8FAFC]">{myPlayerName}</span>. The host is configuring roles and will start the match shortly.
            </p>
          </div>

          {/* Room & Status Info Pill */}
          <div className="w-full grid grid-cols-2 gap-3 pt-4 border-t border-[#1F2430]">
            <div className="p-3 rounded-lg bg-[#090A0F] border border-[#1F2430] text-center">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#94A3B8] block mb-0.5">
                Room
              </span>
              <span className="font-mono font-bold text-lg text-[#3B82F6]">
                {displayRoomCode}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#090A0F] border border-[#1F2430] text-center">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#94A3B8] block mb-0.5">
                Players In
              </span>
              <span className="font-mono font-bold text-lg text-[#22C55E]">
                {playerCount}
              </span>
            </div>
          </div>

          {/* Secret Controller Note */}
          <div className="w-full flex items-center gap-2.5 p-3 rounded-lg bg-[#191C28]/60 border border-[#1F2430] text-left">
            <Shield className="w-4 h-4 text-red-400 shrink-0" />
            <div className="text-[11px] text-[#94A3B8] leading-tight">
              Keep this screen open. Your secret role and private night actions will be delivered here.
            </div>
          </div>

          {/* Leave Button */}
          <button
            onClick={leaveRoom}
            className="w-full py-2.5 px-4 rounded-xl bg-[#090A0F] hover:bg-[#191C28] border border-[#1F2430] text-[#94A3B8] hover:text-[#EF4444] text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Leave Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerWaiting;
