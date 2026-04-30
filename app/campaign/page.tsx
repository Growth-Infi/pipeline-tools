"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Megaphone, Loader2, AlertCircle, Mail, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_MEET_INVITE_BACKEND_URL;

interface Campaign {
    id: string;
    user_id: string;
    name: string;
    meet_link: string;
    total_recipients: number;
    sent_count: number;
    status: "running" | "paused" | "completed" | "pending";
    created_at: string;
}

const statusColors: Record<string, string> = {
    running: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    paused: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    completed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    pending: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function EmailInvitesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const CURRENT_USER_ID = user?.id;

    useEffect(() => {
        if (!authLoading && !user) router.push("/");
    }, [user, authLoading]);

    useEffect(() => {
        if (authLoading) return; // wait for auth
        if (!CURRENT_USER_ID) return;

        const fetchCampaigns = async () => {
            try {
                console.log(API_BASE)
                const res = await fetch(`${API_BASE}/campaign/?user_id=${CURRENT_USER_ID}`);
                const data = await res.json();
                console.log(data)
                setCampaigns(data);
            } catch {
                setError("Failed to load campaigns");
            } finally {
                setLoading(false);
            }
        };
        fetchCampaigns();
    }, [CURRENT_USER_ID, authLoading]);

    if (authLoading) return (
        <div className="h-screen bg-[#050505] flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
    );

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    return (
        <div className="h-screen bg-[#050505] text-white flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-sm font-bold text-white uppercase tracking-wider">Campaigns</h1>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Manage your outreach campaigns</p>
                    </div>
                    {/* maybe add a create new campaign here in the future */}
                    {/* <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 transition-all text-xs font-bold text-white">
                        <Plus className="w-3.5 h-3.5" />
                        New Campaign
                    </button> */}
                    <button
                        onClick={() => router.push("/emailSenders")}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-all text-xs font-bold text-zinc-300"
                    >
                        <Mail className="w-3.5 h-3.5" />
                        Email Senders
                    </button>
                </div>

                {loading && (
                    <div className="flex items-center justify-center h-64 gap-2 text-zinc-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">Loading campaigns…</span>
                    </div>
                )}

                {error && (
                    <div className="flex items-center justify-center h-64 gap-2 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">{error}</span>
                    </div>
                )}

                {!loading && !error && campaigns.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-600">
                        <Megaphone className="w-8 h-8 opacity-30" />
                        <p className="text-xs">No campaigns yet</p>
                    </div>
                )}

                {!loading && !error && campaigns.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {campaigns.map((campaign, i) => {
                            const pct = campaign.total_recipients > 0
                                ? Math.round((campaign.sent_count / campaign.total_recipients) * 100)
                                : 0;

                            return (
                                <motion.button
                                    key={campaign.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => router.push(`/campaign/${campaign.id}`)}
                                    className="text-left bg-[#0b0b0b] border border-[#1a1a1a] hover:border-white/10 rounded-2xl p-4 transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h2 className="text-xs font-semibold text-zinc-200 line-clamp-1 flex-1">{campaign.name}</h2>
                                        <span className={`shrink-0 ml-2 text-[9px] font-bold px-2 py-0.5 rounded-md border capitalize ${statusColors[campaign.status] || statusColors.pending}`}>
                                            {campaign.status}
                                        </span>
                                    </div>

                                    <p className="text-[10px] text-zinc-600 mb-3 font-mono truncate">{campaign.meet_link}</p>

                                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1.5">
                                        <span>Progress</span>
                                        <span className="font-mono">{campaign.sent_count} / {campaign.total_recipients}</span>
                                    </div>

                                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
                                        <motion.div
                                            className="h-full bg-emerald-500 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-600">{formatDate(campaign.created_at)}</span>
                                        <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}



