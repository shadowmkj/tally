'use client';

import React from 'react';
import { Megaphone, Pin, Clock } from 'lucide-react';
import type { Announcement } from '@/context/CompetitionContext';
import { ModalPortal } from '@/components/ModalPortal';

interface AnnouncementsModalProps {
  announcements: Announcement[];
  onClose: () => void;
}

export const AnnouncementsModal: React.FC<AnnouncementsModalProps> = ({
  announcements,
  onClose,
}) => {
  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] my-auto">
        
        {/* Modal Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Live Contest Broadcasts</h3>
              <p className="text-[11px] text-zinc-400">Official announcements from Wecode GCEK Organizers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-100 text-sm font-mono"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {announcements.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No broadcasts posted yet for this competition.
            </div>
          ) : (
            announcements.map((a) => (
              <div
                key={a.id}
                className={`p-4 rounded-xl border space-y-2 text-xs ${
                  a.pinned
                    ? 'bg-primary-500/10 border-primary-500/40 text-primary-200'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                    {a.pinned && <Pin className="w-3.5 h-3.5 text-primary-400 fill-primary-400" />}
                    <span>{a.title}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(a.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="text-xs leading-relaxed whitespace-pre-line text-zinc-300">
                  {a.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors"
          >
            Close & Back to Contest
          </button>
        </div>

      </div>
    </div>
    </ModalPortal>
  );
};
