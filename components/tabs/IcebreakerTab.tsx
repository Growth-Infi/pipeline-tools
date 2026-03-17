'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play, X, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const DEFAULT_PROMPT = `You are an expert B2B sales copywriter writing cold email ice-breakers.

Given a prospect's LinkedIn profile and company data, write ONE personalised opening sentence for a cold outreach email.

Rules:
- Max 1-2 sentences, punchy and specific
- Reference something concrete from their profile or company (a milestone, growth signal, recent initiative, role, or product)
- Sound human and conversational — not templated
- Do NOT mention LinkedIn or that you found this data anywhere
- Do NOT start with "I noticed" or "I saw"
- Do NOT include a pitch — just the opener
- Return ONLY the ice-breaker. No preamble, no explanation.`;

export default function IcebreakerTab() {
    const { csvData, columnOrder, setCsvData } = useAppStore();
    const columns = columnOrder.length > 0 ? columnOrder : Object.keys(csvData[0] || {});

    const [modalOpen, setModalOpen] = useState(false);
    const [profileCol, setProfileCol] = useState('');
    const [companyCol, setCompanyCol] = useState('');
    const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });

    const canRun = csvData.length > 0 && (profileCol || companyCol);
    const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;
    const isDone = progress.done > 0 && progress.done === progress.total && !isRunning;

    const handleRun = async (prompt: string) => {
        if (!canRun) return;

        const newData = [...csvData];
        setIsRunning(true);
        setProgress({ done: 0, total: newData.length, errors: 0 });

        const BATCH_SIZE = 10;
        const CONCURRENCY = 3;

        const processBatch = async (profileUrlsBatch: string[], companyUrlsBatch: string[], indices: number[]) => {
            try {
                // Step 1: scrape
                const scrapeRes = await fetch('/api/apify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        profileUrls: profileUrlsBatch,
                        companyUrls: companyUrlsBatch,
                    }),
                });
                const { profiles, companies } = await scrapeRes.json();

                // Step 2: generate ice-breaker per row
                await Promise.all(indices.map(async (rowIdx, i) => {
                    try {
                        const genRes = await fetch('/api/openai', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                messages: [
                                    { role: 'system', content: prompt },
                                    {
                                        role: 'user', content: `Profile: ${JSON.stringify(profiles[i] ?? {})}
Company: ${JSON.stringify(companies[i] ?? {})}

Write the ice-breaker now.`
                                    }
                                ],
                                max_tokens: 120,
                                temperature: 0.8,
                            }),
                        });
                        const genData = await genRes.json();
                        newData[rowIdx] = { ...newData[rowIdx], icebreaker: genData.result ?? '' };
                    } catch {
                        newData[rowIdx] = { ...newData[rowIdx], icebreaker: '' };
                        setProgress(p => ({ ...p, errors: p.errors + 1 }));
                    }
                    setProgress(p => ({ ...p, done: p.done + 1 }));
                    setCsvData([...newData]);
                }));

            } catch {
                indices.forEach(rowIdx => {
                    newData[rowIdx] = { ...newData[rowIdx], icebreaker: '' };
                });
                setProgress(p => ({ ...p, done: p.done + indices.length, errors: p.errors + indices.length }));
                setCsvData([...newData]);
            }
        };

        // build batches
        const batches: { profileUrls: string[], companyUrls: string[], indices: number[] }[] = [];
        for (let i = 0; i < newData.length; i += BATCH_SIZE) {
            const slice = newData.slice(i, i + BATCH_SIZE);
            batches.push({
                profileUrls: slice.map(row => String(row[profileCol] ?? '').trim()),
                companyUrls: slice.map(row => String(row[companyCol] ?? '').trim()),
                indices: slice.map((_, j) => i + j),
            });
        }

        // run batches with concurrency limit
        for (let i = 0; i < batches.length; i += CONCURRENCY) {
            const chunk = batches.slice(i, i + CONCURRENCY).map(b => processBatch(b.profileUrls, b.companyUrls, b.indices));
            await Promise.all(chunk);
        }

        setIsRunning(false);
    };

    return (
        <div className="p-4 space-y-6">

            {/* Header card */}
            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Sparkles className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-xs font-medium text-zinc-200">Ice-breaker Generator</p>
                    <p className="text-[10px] text-zinc-500">Scrapes LinkedIn + generates personalised openers via AI</p>
                </div>
            </div>

            {/* Column mapping */}
            <section className="space-y-3">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Column Mapping</h3>

                <div className="space-y-2">
                    <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 px-1">Profile URL column</label>
                        <select
                            value={profileCol}
                            onChange={e => setProfileCol(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
                        >
                            <option value="">— none —</option>
                            {columns.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 px-1">Company URL column</label>
                        <select
                            value={companyCol}
                            onChange={e => setCompanyCol(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
                        >
                            <option value="">— none —</option>
                            {columns.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                    </div>
                </div>
            </section>

            {/* Run / progress */}
            <section className="space-y-3">
                {isRunning ? (
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-zinc-400">Generating ice-breakers…</span>
                            <span className="text-purple-400 font-mono">{progress.done} / {progress.total}</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-purple-500 rounded-full"
                                animate={{ width: `${pct}%` }}
                                transition={{ type: 'spring', stiffness: 100 }}
                            />
                        </div>
                        {progress.errors > 0 && (
                            <p className="text-[10px] text-red-400">{progress.errors} row{progress.errors > 1 ? 's' : ''} failed</p>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => canRun && setModalOpen(true)}
                        disabled={!canRun}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Sparkles className="w-3 h-3" />
                        Generate Ice-breakers
                    </button>
                )}

                {!canRun && !isRunning && (
                    <p className="text-[10px] text-zinc-600 text-center">Select at least one URL column to continue</p>
                )}

                {isDone && (
                    <p className="text-[10px] text-emerald-400 text-center">
                        Done — {progress.total - progress.errors} ice-breakers written to <span className="font-mono">icebreaker</span> column
                    </p>
                )}
            </section>

            {/* Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                            className="w-full max-w-2xl bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0a0a0a]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Ice-breaker Generator</h2>
                                        <p className="text-[10px] text-zinc-500">Edit the prompt then run across all rows</p>
                                    </div>
                                </div>
                                <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal body */}
                            <div className="p-6 space-y-4">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">System Prompt</label>
                                <div className="relative">
                                    <textarea
                                        value={systemPrompt}
                                        onChange={e => setSystemPrompt(e.target.value)}
                                        className="w-full h-64 bg-[#0a0a0a] border border-white/10 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-purple-500/50 resize-none leading-relaxed"
                                        placeholder="Enter instructions for the AI..."
                                    />
                                    <div className="absolute bottom-3 right-4 text-[10px] text-zinc-600 bg-[#0a0a0a] px-2 py-0.5 rounded border border-white/5">
                                        {systemPrompt.length} chars
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSystemPrompt(DEFAULT_PROMPT)}
                                    className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    <RotateCcw className="w-3 h-3" /> Reset to default
                                </button>
                            </div>

                            {/* Modal footer */}
                            <div className="p-5 border-t border-white/5 bg-[#0a0a0a] flex justify-end gap-3">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => { handleRun(systemPrompt); setModalOpen(false); }}
                                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all flex items-center gap-2"
                                >
                                    <Play className="w-4 h-4" />
                                    Run — {csvData.length} rows
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}