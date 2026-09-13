import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { RefreshCw, Coffee, Radio } from 'lucide-react';

export const ServerWakeupModal: React.FC = () => {
  const { isConnected } = useGameStore();
  const [showDelayedUI, setShowDelayedUI] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    // Wait 3 seconds before showing the cold-start wake-up UI
    const initialTimer = setTimeout(() => {
      if (!isConnected) {
        setShowDelayedUI(true);
      }
    }, 3000);

    return () => clearTimeout(initialTimer);
  }, [isConnected]);

  useEffect(() => {
    let interval: number | null = null;

    if (showDelayedUI && !isConnected) {
      interval = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showDelayedUI, isConnected]);

  // If connected, component is destroyed/hidden
  if (isConnected) return null;

  const progressPercent = Math.min(100, Math.round((elapsedSeconds / 50) * 100));

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-between p-6 sm:p-10 select-none text-white animate-fadeIn">
      {/* Top discreet status */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-400">
        <Radio className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
        <span>SERVER STATUS</span>
      </div>

      {/* Main Center Content */}
      <div className="max-w-md w-full text-center space-y-6 my-auto flex flex-col items-center">
        {!showDelayedUI ? (
          /* Initial 0-3s quick connecting state */
          <div className="flex flex-col items-center gap-4 py-8 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-blue-400 shadow-2xl">
              <RefreshCw className="w-7 h-7 animate-spin text-blue-500" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-white font-mono">
                Connecting...
              </h2>
              <p className="text-xs text-neutral-500 font-mono">
                Establishing realtime link
              </p>
            </div>
          </div>
        ) : (
          /* Delayed >3s Server Waking Up UI */
          <div className="w-full flex flex-col items-center gap-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-blue-950/30 border border-blue-800/50 flex items-center justify-center text-blue-400 shadow-2xl shadow-blue-950/60 animate-pulse">
              <Coffee className="w-8 h-8 text-blue-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight">
                Waking up the server...
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
                Since this is a free server, it went to sleep. It usually takes about 50 seconds to brew coffee and boot up.
              </p>
            </div>

            {/* Timer and Progress display */}
            <div className="w-full p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  <span>Boot sequence:</span>
                </span>
                <span className="font-bold text-blue-400 text-sm">
                  {elapsedSeconds}s / ~50s
                </span>
              </div>

              {/* Slow-pulsing progress bar */}
              <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden p-0.5 border border-neutral-800">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out animate-pulse"
                  style={{ width: `${Math.max(4, progressPercent)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom info text */}
      <div className="text-[11px] font-mono text-neutral-600 uppercase tracking-widest">
        OLED Deep Sleep Recovery
      </div>
    </div>
  );
};

export default ServerWakeupModal;
