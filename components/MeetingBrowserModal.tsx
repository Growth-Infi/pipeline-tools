'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Video, CheckSquare, Square, Trello, ChevronRight, Loader2, AlertCircle, Calendar, Users } from 'lucide-react';
import { TrelloBoardModal } from './TrelloBoardModal';

interface ActionItem {
    description: string;
    completed: boolean;
    assignee?: { name: string; email: string };
    recording_timestamp?: string;
}

interface Meeting {
    recording_id: number;
    title: string;
    created_at: string;
    action_items: ActionItem[];
    calendar_invitees?: { name: string; email: string; is_external: boolean }[];
}

interface MeetingBrowserModalProps {
    onClose: () => void;
}

export function MeetingBrowserModal({ onClose }: MeetingBrowserModalProps) {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [trelloModalOpen, setTrelloModalOpen] = useState(false);
    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                const res = await fetch('/api/fathom/meetings');
                const data = await res.json();
                console.log('raw data:', data);
                console.log('items:', data.result?.items);
                const items = (data.result || []).map((m: any) => ({
                    recording_id: m.recording_id,
                    title: m.title,
                    created_at: m.created_at,
                    action_items: m.action_items || [],
                    calendar_invitees: m.calendar_invitees || [],
                }));
                setMeetings(items);
            } catch {
                setError('Failed to load meetings');
            } finally {
                setLoading(false);
            }
        };
        fetchMeetings();
    }, []);

    const toggleItem = (idx: number) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            next.has(idx) ? next.delete(idx) : next.add(idx);
            return next;
        });
    };

    const selectAll = () => {
        if (!selectedMeeting) return;
        setSelectedItems(new Set(selectedMeeting.action_items.map((_, i) => i)));
    };

    const clearAll = () => setSelectedItems(new Set());

    const selectedActionItems = selectedMeeting
        ? [...selectedItems].map(i => selectedMeeting.action_items[i])
        : [];

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-full max-w-3xl bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                style={{ maxHeight: '85vh' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0a0a0a] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Video className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Fathom Meetings</h2>
                            <p className="text-[10px] text-zinc-500">Select a meeting to view action items</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Meeting list */}
                    <div className="w-2/5 border-r border-white/5 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-full gap-2 text-zinc-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs">Loading meetings…</span>
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center h-full gap-2 text-red-400">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-xs">{error}</span>
                            </div>
                        ) : meetings.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-zinc-600 text-xs">No meetings found</div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {meetings.map(meeting => (
                                    <button
                                        key={meeting.recording_id}
                                        onClick={() => { setSelectedMeeting(meeting); setSelectedItems(new Set()); }}
                                        className={`w-full text-left p-3 rounded-xl transition-all border ${selectedMeeting?.recording_id === meeting.recording_id
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                                            : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10 text-zinc-300'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-xs font-medium leading-snug line-clamp-2">{meeting.title}</p>
                                            {meeting.action_items.length > 0 && (
                                                <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                                    {meeting.action_items.length}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-zinc-600">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(meeting.created_at)}
                                        </div>
                                        {meeting.calendar_invitees && meeting.calendar_invitees.length > 0 && (
                                            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-zinc-600">
                                                <Users className="w-3 h-3" />
                                                {meeting.calendar_invitees.length} invitees
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action items panel */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {!selectedMeeting ? (
                            <div className="flex items-center justify-center h-full text-zinc-600 text-xs">
                                ← Select a meeting
                            </div>
                        ) : (
                            <>
                                <div className="p-4 border-b border-white/5 shrink-0">
                                    <p className="text-xs font-medium text-white line-clamp-1">{selectedMeeting.title}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-[10px] text-zinc-500">{selectedMeeting.action_items.length} action items</span>
                                        {selectedMeeting.action_items.length > 0 && (
                                            <>
                                                <button onClick={selectAll} className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors">Select all</button>
                                                <button onClick={clearAll} className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">Clear</button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                                    {selectedMeeting.action_items.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-zinc-600 text-xs">No action items for this meeting</div>
                                    ) : (
                                        selectedMeeting.action_items.map((item, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => toggleItem(idx)}
                                                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${selectedItems.has(idx)
                                                    ? 'bg-emerald-500/10 border-emerald-500/25'
                                                    : 'bg-zinc-900/40 border-white/5 hover:border-white/10'
                                                    }`}
                                            >
                                                {selectedItems.has(idx)
                                                    ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                                    : <Square className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                                                }
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-zinc-200 leading-snug">{item.description}</p>
                                                    {item.assignee && (
                                                        <p className="text-[10px] text-zinc-500 mt-1">{item.assignee.name}</p>
                                                    )}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-white/5 bg-[#0a0a0a] flex items-center justify-between shrink-0">
                    <p className="text-[10px] text-zinc-600">
                        {selectedItems.size > 0 ? `${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''} selected` : 'No items selected'}
                    </p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
                            Cancel
                        </button>
                        <button
                            onClick={() => setTrelloModalOpen(true)}
                            disabled={selectedItems.size === 0}
                            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all flex items-center gap-2"
                        >
                            <Trello className="w-4 h-4" />
                            Push to Trello
                        </button>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {trelloModalOpen && (
                    <TrelloBoardModal
                        actionItems={selectedActionItems}
                        onClose={() => setTrelloModalOpen(false)}
                        onSuccess={() => { setTrelloModalOpen(false); onClose(); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}