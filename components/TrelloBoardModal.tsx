'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trello, ChevronRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ActionItem {
    description: string;
    completed: boolean;
    assignee?: { name: string; email: string };
}

interface Board {
    id: string;
    name: string;
}

interface TrelloList {
    id: string;
    name: string;
}

interface TrelloBoardModalProps {
    actionItems: ActionItem[];
    onClose: () => void;
    onSuccess: () => void;
}

export function TrelloBoardModal({ actionItems, onClose, onSuccess }: TrelloBoardModalProps) {
    const [boards, setBoards] = useState<Board[]>([]);
    const [lists, setLists] = useState<TrelloList[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
    const [selectedList, setSelectedList] = useState<TrelloList | null>(null);
    const [loadingBoards, setLoadingBoards] = useState(true);
    const [loadingLists, setLoadingLists] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchBoards = async () => {
            try {
                const res = await fetch('http://localhost:5001/api/tasks/trello/boards');
                const data = await res.json();
                setBoards(data.boards || []);
            } catch {
                setError('Failed to load Trello boards');
            } finally {
                setLoadingBoards(false);
            }
        };
        fetchBoards();
    }, []);

    const selectBoard = async (board: Board) => {
        setSelectedBoard(board);
        setSelectedList(null);
        setLists([]);
        setLoadingLists(true);
        try {
            const res = await fetch(`http://localhost:5001/api/tasks/trello/boards/${board.id}/lists`);
            const data = await res.json();
            setLists(data.lists || []);
        } catch {
            setError('Failed to load lists');
        } finally {
            setLoadingLists(false);
        }
    };

    const createCards = async () => {
        if (!selectedList) return;
        setCreating(true);
        setError('');
        try {
            const res = await fetch('http://localhost:5001/api/tasks/trello/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listId: selectedList.id, actionItems }),
            });
            if (!res.ok) throw new Error();
            setSuccess(true);
            setTimeout(onSuccess, 1500);
        } catch {
            setError('Failed to create cards');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-full max-w-lg bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0a0a0a]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Trello className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Push to Trello</h2>
                            <p className="text-[10px] text-zinc-500">{actionItems.length} card{actionItems.length > 1 ? 's' : ''} will be created</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
                    {/* Success state */}
                    {success && (
                        <div className="flex items-center justify-center gap-2 py-6 text-emerald-400">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-sm font-medium">Cards created successfully!</span>
                        </div>
                    )}

                    {!success && (
                        <>
                            {/* Action items preview */}
                            <div className="space-y-1.5">
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Cards to create</h3>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {actionItems.map((item, i) => (
                                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-zinc-900/50 border border-white/5">
                                            <span className="text-[10px] text-zinc-600 font-mono mt-0.5">{i + 1}</span>
                                            <p className="text-[10px] text-zinc-300 leading-snug">{item.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Board picker */}
                            <div className="space-y-2">
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select Board</h3>
                                {loadingBoards ? (
                                    <div className="flex items-center gap-2 text-zinc-500 text-xs py-2">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading boards…
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {boards.map(board => (
                                            <button
                                                key={board.id}
                                                onClick={() => selectBoard(board)}
                                                className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-xs ${selectedBoard?.id === board.id
                                                    ? 'bg-blue-500/10 border-blue-500/30 text-white'
                                                    : 'bg-zinc-900/40 border-white/5 hover:border-white/10 text-zinc-300'
                                                    }`}
                                            >
                                                {board.name}
                                                {selectedBoard?.id === board.id && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* List picker */}
                            {selectedBoard && (
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select List</h3>
                                    {loadingLists ? (
                                        <div className="flex items-center gap-2 text-zinc-500 text-xs py-2">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading lists…
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {lists.map(list => (
                                                <button
                                                    key={list.id}
                                                    onClick={() => setSelectedList(list)}
                                                    className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-xs ${selectedList?.id === list.id
                                                        ? 'bg-blue-500/10 border-blue-500/30 text-white'
                                                        : 'bg-zinc-900/40 border-white/5 hover:border-white/10 text-zinc-300'
                                                        }`}
                                                >
                                                    {list.name}
                                                    {selectedList?.id === list.id && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 text-red-400 text-xs">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="p-5 border-t border-white/5 bg-[#0a0a0a] flex justify-end gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
                            Cancel
                        </button>
                        <button
                            onClick={createCards}
                            disabled={!selectedList || creating}
                            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all flex items-center gap-2"
                        >
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trello className="w-4 h-4" />}
                            {creating ? 'Creating…' : `Create ${actionItems.length} card${actionItems.length > 1 ? 's' : ''}`}
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}