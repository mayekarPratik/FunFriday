import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Users, Crown, Copy, Check, Tv, Play, LogOut, RefreshCw } from 'lucide-react';

export const HostLobby: React.FC = () => {
  const { gameState, leaveRoom, startGame } = useGameStore();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  if (!gameState) return null;

  const handleStartGame = async () => {
    setStarting(true);
    await startGame();
    setStarting(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameState.room_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-12">
      {/* Top Banner / Room Code Display */}
      <div className="wope-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#3B82F6]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left z-0">
          <div className="w-16 h-16 rounded-2xl bg-[#191C28] border border-[#1F2430] flex items-center justify-center text-[#3B82F6] shrink-0">
            <Tv className="w-8 h-8" />
          </div>

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="text-xs uppercase font-mono tracking-widest text-[#94A3B8]">
                Join via Browser
              </span>
              <span className="wope-badge bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30">
                LOBBY PHASE
              </span>
            </div>
            <p className="text-sm text-[#94A3B8]">
              Go to this URL on your phone and enter the 4-letter room code
            </p>
          </div>
        </div>

        {/* Big Room Code Display */}
        <div className="flex items-center gap-3 bg-[#090A0F] border border-[#1F2430] p-3 sm:px-6 sm:py-4 rounded-xl z-0">
          <div className="text-left">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#94A3B8] block">
              ROOM CODE
            </span>
            <span className="text-4xl sm:text-5xl font-black tracking-widest text-[#3B82F6] font-mono select-all">
              {gameState.room_code}
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            title="Copy Room Code"
            className="p-2.5 rounded-lg border border-[#1F2430] bg-[#12141C] hover:bg-[#191C28] text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
          >
            {copied ? <Check className="w-5 h-5 text-[#22C55E]" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Players Section Header & Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#12141C] border border-[#1F2430] flex items-center justify-center text-[#94A3B8]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F8FAFC]">
              Connected Players
            </h2>
            <p className="text-xs text-[#94A3B8]">
              {gameState.players.length} {gameState.players.length === 1 ? 'player' : 'players'} in room
            </p>
          </div>
        </div>

        {/* Host Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={leaveRoom}
            className="wope-btn-secondary px-3.5 py-2 text-xs font-medium flex items-center gap-1.5 cursor-pointer text-[#94A3B8] hover:text-[#EF4444]"
          >
            <LogOut className="w-3.5 h-3.5" /> Close Room
          </button>
          <button
            onClick={handleStartGame}
            disabled={gameState.players.length < 3 || starting}
            title={gameState.players.length < 3 ? 'Need at least 3 players to start' : 'Start game'}
            className="wope-btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {starting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Start Game {gameState.players.length < 3 && `(Min 3)`}</span>
          </button>
        </div>
      </div>

      {/* Player Grid */}
      {gameState.players.length === 0 ? (
        <div className="wope-card p-12 text-center flex flex-col items-center justify-center gap-4 border-dashed">
          <div className="w-12 h-12 rounded-full bg-[#191C28] border border-[#1F2430] flex items-center justify-center text-[#94A3B8] animate-pulse">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-[#F8FAFC] text-base">No Players Joined Yet</h3>
            <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
              Tell players to open the app on their mobile browsers and join using code{' '}
              <span className="font-mono font-bold text-[#3B82F6]">{gameState.room_code}</span>.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {gameState.players.map((player, index) => {
            const isHostSocket = player.socket_id === gameState.host_socket_id;
            return (
              <div
                key={player.socket_id}
                className="wope-card-interactive p-4 flex flex-col items-center text-center gap-3 relative animate-fadeIn"
              >
                {/* Avatar circle */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#1E293B] to-[#334155] border border-[#1F2430] flex items-center justify-center font-bold text-base text-[#F8FAFC] shadow-md">
                  {player.name.charAt(0).toUpperCase()}
                </div>

                <div className="space-y-0.5 w-full">
                  <p className="font-bold text-sm text-[#F8FAFC] truncate px-1">
                    {player.name}
                  </p>
                  <p className="text-[11px] font-mono text-[#94A3B8]">
                    Player #{index + 1}
                  </p>
                </div>

                {isHostSocket && (
                  <span className="wope-badge bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/30 flex items-center gap-1 text-[10px]">
                    <Crown className="w-3 h-3" /> Host
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
