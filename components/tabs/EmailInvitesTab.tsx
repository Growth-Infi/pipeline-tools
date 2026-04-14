"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Megaphone, Play, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "http://localhost:5000";

export default function EmailInvitesTab() {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <section className="space-y-2">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Campaigns
            </h3>

            <button
                onClick={() => setModalOpen(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all text-left"
            >
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                    <Megaphone className="w-4 h-4" />
                </div>
                <div className="flex-1">
                    <div className="text-xs font-medium text-zinc-200">Create Campaign</div>
                    <div className="text-[10px] text-zinc-500">Set up a new outreach campaign</div>
                </div>
            </button>

            <AnimatePresence>
                {modalOpen && <CreateCampaignModal onClose={() => setModalOpen(false)} />}
            </AnimatePresence>
        </section>
    );
}

function CreateCampaignModal({ onClose }: { onClose: () => void }) {
    const { csvData, columnOrder } = useAppStore();
    const [name, setName] = useState("");
    const [meetLink, setMeetLink] = useState("");
    const [emailCol, setEmailCol] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const rawColumns = columnOrder.length > 0 ? columnOrder : Object.keys(csvData[0] || {});
    const columns = rawColumns.filter((col) => col.toLowerCase() !== "status");

    // Auto-detect email column
    useEffect(() => {
        const keywords = ["email", "mail"];
        const detected = columns.find((col) =>
            keywords.some((k) => col.toLowerCase().includes(k))
        );
        if (!emailCol && detected) {
            setEmailCol(detected);
        }
    }, [columns]);

    const canSubmit = name.trim() && meetLink.trim() && emailCol && !loading;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        setError("");

        const emailList = csvData
            .map((row) => String(row[emailCol] || "").trim())
            .filter(Boolean);

        try {
            const res = await fetch(`${API_BASE}/campaigns`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    meet_link: meetLink.trim(),
                    emails: emailList,
                }),
            });

            if (!res.ok) throw new Error();
            setSuccess(true);
            setTimeout(onClose, 1500);
        } catch {
            setError("Failed to create campaign. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0a0a0a]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Create Campaign</h2>
                            <p className="text-[10px] text-zinc-500">Fill in the details to launch a campaign</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {success ? (
                        <div className="flex items-center justify-center py-6 text-emerald-400 text-sm font-medium">
                            Campaign created successfully!
                        </div>
                    ) : (
                        <>
                            {/* Campaign name */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Campaign Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Q2 Outreach"
                                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-rose-500/50 transition-colors"
                                />
                            </div>

                            {/* Meet link */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Meet Link</label>
                                <input
                                    type="url"
                                    value={meetLink}
                                    onChange={e => setMeetLink(e.target.value)}
                                    placeholder="https://meet.google.com/..."
                                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-rose-500/50 transition-colors font-mono"
                                />
                            </div>

                            {/* Email column selector */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Email Column</label>
                                <select
                                    value={emailCol}
                                    onChange={(e) => setEmailCol(e.target.value)}
                                    disabled={loading}
                                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50 transition-colors"
                                >
                                    <option value="">Select email column...</option>
                                    {columns.map((col) => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                                {emailCol && (
                                    <p className="text-[10px] text-zinc-600 px-1">
                                        {csvData.filter(row => String(row[emailCol] || "").trim()).length} emails found in CSV
                                    </p>
                                )}
                                {!emailCol && (
                                    <p className="text-[10px] text-amber-400 px-1">
                                        ⚠️ No email column detected. Please select one.
                                    </p>
                                )}
                            </div>

                            {error && (
                                <p className="text-[10px] text-red-400">{error}</p>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="p-5 border-t border-white/5 bg-[#0a0a0a] flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all flex items-center gap-2"
                        >
                            {loading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                                : <><Play className="w-4 h-4" /> Create Campaign</>
                            }
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}