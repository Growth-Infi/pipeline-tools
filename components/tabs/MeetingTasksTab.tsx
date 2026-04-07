'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, ChevronRight } from 'lucide-react';
import { MeetingBrowserModal } from '../MeetingBrowserModal';

export default function MeetingTaskTab() {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div className="p-4 space-y-2">
            <section className="space-y-2">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Meeting Tasks</h3>

                <button
                    onClick={() => setModalOpen(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left"
                >
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Video className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-medium text-zinc-200">Fathom → Trello</div>
                        <div className="text-[10px] text-zinc-500">Pick a meeting, push action items to a Trello board</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                </button>
            </section>

            <AnimatePresence>
                {modalOpen && <MeetingBrowserModal onClose={() => setModalOpen(false)} />}
            </AnimatePresence>
        </div>
    );
}