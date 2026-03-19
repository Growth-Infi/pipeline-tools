'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play, X, RotateCcw, BrainCircuit } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ModelPicker } from '../ModelPicker';
import { PromptEditor } from '../PromptEditor';


const SCRAPE_DEFAULT_PROMPT = `You are an expert B2B sales copywriter writing cold email ice-breakers.

Given a prospect's LinkedIn profile and company data, write ONE personalised opening sentence for a cold outreach email.

Rules:
- Max 1-2 sentences, punchy and specific
- Reference something concrete from their profile or company (a milestone, growth signal, recent initiative, role, or product)
- Sound human and conversational — not templated
- Do NOT mention LinkedIn or that you found this data anywhere
- Do NOT start with "I noticed" or "I saw"
- Do NOT include a pitch — just the opener
- Return ONLY the ice-breaker. No preamble, no explanation.
- use only plain ASCII characters, no em dashes, no special punctuation. Return in a form that can be viewed in csv files`;

const ENHANCE_SYSTEM_PROMPT = `
You are a research assistant. 
Given user information, respond with plain sentences. 

Rules: 
- never ask questions or request more information
- never wrap your response in quotes
- never return markdown or code blocks 
- if you are unfamiliar with the information make a reasonable inference from the name or context provided
- If you do not have an answer, give a helpful generic response based on whatever context is available. 
- always return exactly what was asked and nothing else. Never try to make conversation. Just strickly return what the user wants
- use only plain ASCII characters, no em dashes, no special punctuation
- Never say you don\'t know — always return something useful
- Do NOT include any preamble like "A good ice breaker could be" or "You could say" — return only the ice breaker itself
- Do NOT wrap the response in quotes of any kind`

export default function IcebreakerTab() {
    const { csvData, columnOrder, setCsvData } = useAppStore()
    const columns = columnOrder.length > 0 ? columnOrder : Object.keys(csvData[0] || {});

    //Scrape mode state 
    const [scrapeModalOpen, setScrapeModalOpen] = useState(false);
    const [profileCol, setProfileCol] = useState('');
    const [companyCol, setCompanyCol] = useState('');
    const [systemPrompt, setSystemPrompt] = useState(SCRAPE_DEFAULT_PROMPT);
    const [scrapeRunning, setScrapeRunning] = useState(false);
    const [scrapeProgress, setScrapeProgress] = useState({ done: 0, total: 0, errors: 0 });

    //AI Enrichment mode state 
    const [enrichModalOpen, setEnrichModalOpen] = useState(false);
    const [enrichPrompt, setEnrichPrompt] = useState('');
    const [enrichModel, setEnrichModel] = useState('gpt-4o-mini');
    const [outputColumn, setOutputColumn] = useState('');
    const [enrichRunning, setEnrichRunning] = useState(false);
    const [enrichProgress, setEnrichProgress] = useState({ done: 0, total: 0, errors: 0 });

    //Scrape mode helpers 
    const canScrapeRun = csvData.length > 0 && (profileCol || companyCol);
    const scrapePct = scrapeProgress.total > 0 ? (scrapeProgress.done / scrapeProgress.total) * 100 : 0;
    const scrapeIsDone = scrapeProgress.done > 0 && scrapeProgress.done === scrapeProgress.total && !scrapeRunning;

    //Enrich mode helpers 
    const canEnrichRun = csvData.length > 0 && enrichPrompt.trim().length > 0 && outputColumn.trim().length > 0;
    const enrichPct = enrichProgress.total > 0 ? (enrichProgress.done / enrichProgress.total) * 100 : 0;
    const enrichIsDone = enrichProgress.done > 0 && enrichProgress.done === enrichProgress.total && !enrichRunning;

    const handleScrapeRun = async (prompt: string) => {
        if (!canScrapeRun) return;
        const newData = [...csvData];
        setScrapeRunning(true);
        setScrapeProgress({ done: 0, total: newData.length, errors: 0 });

        const BATCH_SIZE = 10;
        const CONCURRENCY = 3;

        const processBatch = async (profileUrlsBatch: string[], companyUrlsBatch: string[], indices: number[]) => {
            try {
                const scrapeRes = await fetch('/api/apify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profileUrls: profileUrlsBatch, companyUrls: companyUrlsBatch }),
                });
                const { profiles, companies } = await scrapeRes.json();

                await Promise.all(indices.map(async (rowIdx, i) => {
                    try {
                        const genRes = await fetch('/api/openai', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                messages: [
                                    { role: 'system', content: prompt },
                                    { role: 'user', content: `Profile: ${JSON.stringify(profiles[i] ?? {})}\nCompany: ${JSON.stringify(companies[i] ?? {})}\n\nWrite the ice-breaker now.` }
                                ],
                                max_tokens: 120,
                                temperature: 0.8,
                            }),
                        });
                        const genData = await genRes.json();
                        newData[rowIdx] = { ...newData[rowIdx], icebreaker: genData.result ?? '' };
                    } catch {
                        newData[rowIdx] = { ...newData[rowIdx], icebreaker: '' };
                        setScrapeProgress(p => ({ ...p, errors: p.errors + 1 }));
                    }
                    setScrapeProgress(p => ({ ...p, done: p.done + 1 }));
                    setCsvData([...newData]);
                }));
            } catch {
                indices.forEach(rowIdx => { newData[rowIdx] = { ...newData[rowIdx], icebreaker: '' }; });
                setScrapeProgress(p => ({ ...p, done: p.done + indices.length, errors: p.errors + indices.length }));
                setCsvData([...newData]);
            }
        };

        const batches: { profileUrls: string[], companyUrls: string[], indices: number[] }[] = [];
        for (let i = 0; i < newData.length; i += BATCH_SIZE) {
            const slice = newData.slice(i, i + BATCH_SIZE);
            batches.push({
                profileUrls: slice.map(row => String(row[profileCol] ?? '').trim()),
                companyUrls: slice.map(row => String(row[companyCol] ?? '').trim()),
                indices: slice.map((_, j) => i + j),
            });
        }
        for (let i = 0; i < batches.length; i += CONCURRENCY) {
            const chunk = batches.slice(i, i + CONCURRENCY).map(b => processBatch(b.profileUrls, b.companyUrls, b.indices));
            await Promise.all(chunk);
        }
        setScrapeRunning(false);
    };

    const handleAiEnrichment = async () => {
        if (!canEnrichRun) return;
        const newData = [...csvData];
        setEnrichRunning(true);
        setEnrichProgress({ done: 0, total: newData.length, errors: 0 });

        try {
            await Promise.all(csvData.map(async (row, rowIdx) => {
                const interpolated = enrichPrompt.replace(/\{([^}]+)\}/g, (_, field) => {
                    return String(row[field.trim()] ?? '');
                });
                console.log(interpolated)
                try {
                    const response = await fetch('/api/openai', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: [
                                { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
                                { role: 'user', content: interpolated }
                            ],
                            model: enrichModel,
                            max_tokens: 200,
                        }),
                    });
                    const genData = await response.json();
                    newData[rowIdx] = { ...newData[rowIdx], [outputColumn]: genData.result ?? '' };
                    setEnrichProgress(p => ({ ...p, done: p.done + 1 }));
                    setCsvData([...newData])
                } catch {
                    newData[rowIdx] = { ...newData[rowIdx], [outputColumn]: '' };
                    setEnrichProgress(p => ({ ...p, errors: p.errors + 1 }));
                    setCsvData([...newData])
                }

            }))
            setEnrichRunning(false)
            setCsvData([...newData])
        } catch {
            setEnrichProgress(p => ({ ...p, done: p.done + 1, errors: p.errors + 1 }));
            setCsvData([...newData]);
        }


        //get the input prompts and field names, 
        //loop through the field values and send the prompt to the llm, maybe use a field from the row to know which row it belongs to. 
        //write result back and render  
        //   - interpolate {field} tokens in enrichPrompt with row values
        //   - call /api/openai with enrichModel
        //   - write result into newData[rowIdx][outputColumn]
        //   - update enrichProgress as rows complete
    };

    return (
        <div className="p-4 space-y-4">

            {/* Header */}
            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Sparkles className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-xs font-medium text-zinc-200">Ice-breaker Generator</p>
                    <p className="text-[10px] text-zinc-500">Scrape LinkedIn or use AI to research and personalise</p>
                </div>
            </div>

            {/* ── SCRAPE MODE ── */}
            <section className="space-y-3">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">LinkedIn Scraper</h3>

                <div className="space-y-2">
                    <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 px-1">Profile URL column</label>
                        <select value={profileCol} onChange={e => setProfileCol(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50">
                            <option value="">— none —</option>
                            {columns.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 px-1">Company URL column</label>
                        <select value={companyCol} onChange={e => setCompanyCol(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50">
                            <option value="">— none —</option>
                            {columns.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                    </div>
                </div>

                {scrapeRunning ? (
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-zinc-400">Scraping + generating…</span>
                            <span className="text-purple-400 font-mono">{scrapeProgress.done} / {scrapeProgress.total}</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-purple-500 rounded-full" animate={{ width: `${scrapePct}%` }} transition={{ type: 'spring', stiffness: 100 }} />
                        </div>
                        {scrapeProgress.errors > 0 && <p className="text-[10px] text-red-400">{scrapeProgress.errors} row{scrapeProgress.errors > 1 ? 's' : ''} failed</p>}
                    </div>
                ) : (
                    <button onClick={() => canScrapeRun && setScrapeModalOpen(true)} disabled={!canScrapeRun}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2">
                        <Sparkles className="w-3 h-3" /> Generate Ice-breakers
                    </button>
                )}

                {!canScrapeRun && !scrapeRunning && <p className="text-[10px] text-zinc-600 text-center">Select at least one URL column to continue</p>}
                {scrapeIsDone && <p className="text-[10px] text-emerald-400 text-center">Done — {scrapeProgress.total - scrapeProgress.errors} ice-breakers written to <span className="font-mono">icebreaker</span> column</p>}
            </section>

            {/* Divider */}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[9px] text-zinc-700 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* ── AI ENRICHMENT MODE ── */}
            <section className="space-y-3">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">AI Research</h3>
                <p className="text-[10px] text-zinc-600 leading-relaxed">
                    No scraping needed. Reference any CSV column in your prompt using <span className="font-mono text-violet-400">/</span> and the AI will research each row.
                </p>

                {enrichRunning ? (
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-zinc-400">Enriching rows…</span>
                            <span className="text-violet-400 font-mono">{enrichProgress.done} / {enrichProgress.total}</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-violet-500 rounded-full" animate={{ width: `${enrichPct}%` }} transition={{ type: 'spring', stiffness: 100 }} />
                        </div>
                        {enrichProgress.errors > 0 && <p className="text-[10px] text-red-400">{enrichProgress.errors} row{enrichProgress.errors > 1 ? 's' : ''} failed</p>}
                    </div>
                ) : (
                    <button onClick={() => csvData.length > 0 && setEnrichModalOpen(true)} disabled={csvData.length === 0}
                        className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2">
                        <BrainCircuit className="w-3 h-3" /> AI Research Enrichment
                    </button>
                )}

                {csvData.length === 0 && !enrichRunning && <p className="text-[10px] text-zinc-600 text-center">Upload a CSV to get started</p>}
                {enrichIsDone && <p className="text-[10px] text-emerald-400 text-center">Done — {enrichProgress.total - enrichProgress.errors} rows written to <span className="font-mono">{outputColumn || 'output'}</span> column</p>}
            </section>

            {/* ══ SCRAPE MODAL ══ */}
            <AnimatePresence>
                {scrapeModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: 'spring', duration: 0.5 }}
                            className="w-full max-w-2xl bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0a0a0a]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20"><Sparkles className="w-5 h-5" /></div>
                                    <div>
                                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Ice-breaker Generator</h2>
                                        <p className="text-[10px] text-zinc-500">Edit the prompt then run across all rows</p>
                                    </div>
                                </div>
                                <button onClick={() => setScrapeModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">System Prompt</label>
                                <div className="relative">
                                    <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
                                        className="w-full h-64 bg-[#0a0a0a] border border-white/10 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-purple-500/50 resize-none leading-relaxed"
                                        placeholder="Enter instructions for the AI..." />
                                    <div className="absolute bottom-3 right-4 text-[10px] text-zinc-600 bg-[#0a0a0a] px-2 py-0.5 rounded border border-white/5">{systemPrompt.length} chars</div>
                                </div>
                                <button onClick={() => setSystemPrompt(DEFAULT_PROMPT)} className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
                                    <RotateCcw className="w-3 h-3" /> Reset to default
                                </button>
                            </div>
                            <div className="p-5 border-t border-white/5 bg-[#0a0a0a] flex justify-end gap-3">
                                <button onClick={() => setScrapeModalOpen(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
                                <button onClick={() => { handleScrapeRun(systemPrompt); setScrapeModalOpen(false); }}
                                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all flex items-center gap-2">
                                    <Play className="w-4 h-4" /> Run — {csvData.length} rows
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* AI ENRICHMENT MODAL*/}
            <AnimatePresence>
                {enrichModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: 'spring', duration: 0.5 }}
                            className="w-full max-w-2xl bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">

                            {/* Modal header */}
                            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0a0a0a]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20"><BrainCircuit className="w-5 h-5" /></div>
                                    <div>
                                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">AI Research Enrichment</h2>
                                        <p className="text-[10px] text-zinc-500">Type <span className="font-mono text-violet-400">/</span> to reference any CSV column in your prompt</p>
                                    </div>
                                </div>
                                <button onClick={() => setEnrichModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>

                            {/* Modal body */}
                            <div className="p-6 space-y-5">

                                {/* Model picker */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Model</label>
                                    <ModelPicker value={enrichModel} onChange={setEnrichModel} />
                                </div>

                                {/* Output column name */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Output Column Name</label>
                                    <input
                                        type="text"
                                        value={outputColumn}
                                        onChange={e => setOutputColumn(e.target.value)}
                                        placeholder="e.g. company_summary"
                                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-700 focus:outline-none focus:border-violet-500/50"
                                    />
                                    <p className="text-[10px] text-zinc-600 px-1">Results will be written to this column in your CSV</p>
                                </div>

                                {/* Prompt editor with / autocomplete */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Prompt</label>
                                    <PromptEditor
                                        value={enrichPrompt}
                                        onChange={setEnrichPrompt}
                                        columns={columns}
                                        placeholder={`Describe what you want to know about each row.\n\nType / to insert a CSV field, e.g.\n\nResearch {company_name} (domain: {domain}) and write 2 sentences about what they do and who they sell to. If you don't know the company, write a generic response based on the industry.`}
                                    />
                                </div>

                                {/* Field reference hint */}
                                {columns.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {columns.slice(0, 6).map(col => (
                                            <button key={col} onClick={() => setEnrichPrompt(p => p + `{${col}}`)}
                                                className="text-[10px] font-mono px-2 py-1 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors">
                                                /{col}
                                            </button>
                                        ))}
                                        {columns.length > 6 && <span className="text-[10px] text-zinc-600 self-center">+{columns.length - 6} more via /</span>}
                                    </div>
                                )}
                            </div>

                            {/* Modal footer */}
                            <div className="p-5 border-t border-white/5 bg-[#0a0a0a] flex items-center justify-between">
                                <p className="text-[10px] text-zinc-600">
                                    {csvData.length} rows × 1 LLM call each
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setEnrichModalOpen(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
                                    <button
                                        onClick={() => { if (canEnrichRun) { handleAiEnrichment(); setEnrichModalOpen(false); } }}
                                        disabled={!canEnrichRun}
                                        className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all flex items-center gap-2">
                                        <Play className="w-4 h-4" /> Run — {csvData.length} rows
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}