"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Mail, Loader2, AlertCircle, Plus, ToggleLeft, ToggleRight, Clock, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_MEET_INVITE_BACKEND_URL;

interface EmailSender {
    id: string;
    user_id: string;
    email: string;
    daily_limit: number;
    sent_today: number;
    last_sent_at: string | null;
    status: "active" | "inactive";
    created_at: string;
    next_send_at: string | null;
}

export default function EmailSendersPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [senders, setSenders] = useState<EmailSender[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const CURRENT_USER_ID = user?.id;

    useEffect(() => {
        if (!authLoading && !user) router.push("/");
    }, [user, authLoading]);

    useEffect(() => {
        if (authLoading || !CURRENT_USER_ID) return;
        const fetchSenders = async () => {
            try {
                // replace with email endpoint
                const res = await fetch(`${API_BASE}/gmail/accounts?user_id=${CURRENT_USER_ID}`);
                const data = await res.json();
                setSenders(data);
            } catch {
                setError("Failed to load email senders");
            } finally {
                setLoading(false);
            }
        };
        fetchSenders();
    }, [CURRENT_USER_ID, authLoading]);

    const handleToggle = async (sender: EmailSender) => {
        setTogglingId(sender.id);
        const newStatus = sender.status === "active" ? "inactive" : "active";

        // optimistic
        setSenders(prev => prev.map(s => s.id === sender.id ? { ...s, status: newStatus } : s));

        try {
            //update status of email
            const res = await fetch(`${API_BASE}/gmail/senders/${sender.id}/toggle`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error();
        } catch {
            // rollback
            setSenders(prev => prev.map(s => s.id === sender.id ? { ...s, status: sender.status } : s));
        } finally {
            setTogglingId(null);
        }
    };

    const handleAddSender = async () => {
        const res = await fetch(`${API_BASE}/gmail/connect?user_id=${CURRENT_USER_ID}`);
        console.log(res)
        //     window.location.href = `${API_BASE}/gmail/auth?user_id=${CURRENT_USER_ID}`;
    };

    const formatDate = (iso: string | null) => {
        if (!iso) return "Never";
        return new Date(iso).toLocaleDateString("en-US", {
            month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    if (authLoading || loading) return (
        <div className="h-screen bg-[#050505] flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="h-screen bg-[#050505] text-white flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-sm font-bold text-white uppercase tracking-wider">Email Senders</h1>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Manage Gmail accounts used for outreach</p>
                    </div>
                    <button
                        onClick={handleAddSender}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition-all text-xs font-bold text-white"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Gmail Account
                    </button>
                </div>

                {error && (
                    <div className="flex items-center justify-center h-64 gap-2 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">{error}</span>
                    </div>
                )}

                {!error && senders.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-600">
                        <Mail className="w-8 h-8 opacity-30" />
                        <p className="text-xs">No email senders added yet</p>
                        <button
                            onClick={handleAddSender}
                            className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            + Add your first Gmail account
                        </button>
                    </div>
                )}

                {!error && senders.length > 0 && (
                    <div className="space-y-2">
                        {senders.map((sender, i) => {
                            const pct = sender.daily_limit > 0
                                ? Math.round((sender.sent_today / sender.daily_limit) * 100)
                                : 0;

                            return (
                                <motion.div
                                    key={sender.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="bg-[#0b0b0b] border border-[#1a1a1a] rounded-2xl p-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        {/* Left — email + stats */}
                                        <div className="flex-1 min-w-0 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-blue-500/10">
                                                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                                                </div>
                                                <p className="text-xs font-medium text-zinc-200 truncate">{sender.email}</p>
                                                <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-md border capitalize ${sender.status === "active"
                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                    : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                                                    }`}>
                                                    {sender.status}
                                                </span>
                                            </div>

                                            {/* Daily usage */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                                                    <div className="flex items-center gap-1">
                                                        <Send className="w-3 h-3" />
                                                        <span>Daily usage</span>
                                                    </div>
                                                    <span className="font-mono">{sender.sent_today} / {sender.daily_limit}</span>
                                                </div>
                                                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className={`h-full rounded-full ${pct > 80 ? "bg-red-500" : pct > 50 ? "bg-yellow-500" : "bg-emerald-500"}`}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Timestamps */}
                                            <div className="flex items-center gap-4 text-[10px] text-zinc-600">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Last sent: {formatDate(sender.last_sent_at)}</span>
                                                </div>
                                                {sender.next_send_at && (
                                                    <div className="flex items-center gap-1">
                                                        <span>Next: {formatDate(sender.next_send_at)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right — toggle */}
                                        <button
                                            onClick={() => handleToggle(sender)}
                                            disabled={togglingId === sender.id}
                                            className="shrink-0 text-zinc-400 hover:text-white transition-colors disabled:opacity-40"
                                        >
                                            {togglingId === sender.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : sender.status === "active" ? (
                                                <ToggleRight className="w-6 h-6 text-emerald-400" />
                                            ) : (
                                                <ToggleLeft className="w-6 h-6 text-zinc-600" />
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}