import React, { useEffect } from 'react';
import { X, Moon, Sun, BookOpen } from 'lucide-react';
import { WEREWOLF_ROLES, MAFIA_ROLES } from '../constants/gameData';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameType?: 'werewolf' | 'mafia';
}

export const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onClose,
  gameType = 'werewolf'
}) => {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMafia = gameType === 'mafia';
  const roles = isMafia ? MAFIA_ROLES : WEREWOLF_ROLES;
  const title = isMafia ? 'How to Play: Mafia' : 'How to Play: Werewolves';
  const themeColor = isMafia ? 'text-amber-400' : 'text-red-400';
  const themeBg = isMafia ? 'bg-amber-500/10' : 'bg-red-500/10';
  const themeBorder = isMafia ? 'border-amber-500/30' : 'border-red-500/30';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900/80 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${themeBg} border ${themeBorder} flex items-center justify-center ${themeColor}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="rules-modal-title"
                className="text-lg sm:text-xl font-bold text-white tracking-wide font-serif"
              >
                {title}
              </h2>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Game Guide & Role Overview
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close rules modal"
            className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:border-slate-500 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-left">
          {/* The Cycle Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#3B82F6] font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" /> The Cycle
            </h3>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              {isMafia ? (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  The game alternates between <strong className="text-white">Night</strong> and{' '}
                  <strong className="text-white">Day</strong>. At Night, the Mafia syndicate covertly chooses a citizen to eliminate while detectives and doctors take secret actions. During the Day, all citizens debate clues and vote to convict and eliminate a suspected Mafia member.
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  The game alternates between <strong className="text-white">Night</strong> and{' '}
                  <strong className="text-white">Day</strong>. At Night, the Village sleeps while the Werewolves secretly choose a victim. During the Day, the Village debates who the wolves are and votes to execute a suspect.
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <Moon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-white block font-medium">Night Phase</strong>
                    <span className="text-slate-400 text-[11px] leading-tight">
                      {isMafia
                        ? 'Mafia coordinate hits while special roles investigate or save.'
                        : 'Special roles act in secrecy while villagers sleep.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <Sun className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-white block font-medium">Day Phase</strong>
                    <span className="text-slate-400 text-[11px] leading-tight">
                      Casualties revealed. Citizens debate, accuse, and vote out a suspect.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* The Roles Section */}
          <div className="space-y-3">
            <h3 className={`text-xs font-mono uppercase tracking-widest ${themeColor} font-bold flex items-center gap-2`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isMafia ? 'bg-amber-400' : 'bg-red-400'}`} /> The Roles ({roles.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex items-start gap-3"
                >
                  <div className={`w-9 h-9 rounded-lg ${role.tagBg} border ${role.tagBorder} flex items-center justify-center ${role.tagColor} shrink-0 text-base`}>
                    {role.emoji}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-white">{role.name}</h4>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${role.tagBg} ${role.tagColor} border ${role.tagBorder}`}>
                        {role.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800/80 bg-slate-950/40 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition cursor-pointer"
          >
            Got it, Let's Play
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
