'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Scissors, CaseSensitive, Type, ChevronDown, Play, Eraser, Rows3, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PROMPT_BRAND_KEYWORDS = `You are a B2B data cleaner. Your job is to clean company names for use in cold email outreach.

Rules:
- Remove legal suffixes: Inc, Ltd, LLC, Pvt Ltd, Corp, Plc, Srl, GmbH, Limited, etc.
- Remove generic descriptors at the end: Solutions Group, Software & Services, Data Solutions, Technologies (only if something cleaner remains)
- If the name has a bracketed expansion like "PW (PhysicsWallah)", return the expansion: "PhysicsWallah"
- Never create acronyms — if the original is "Tata Consultancy Services", return "Tata Consultancy Services"
- Never shorten a name that is already clean
- When in doubt, return the name unchanged
- Return ONLY the result. No explanation, no extra words, nothing else.

Examples:
"Laplink Software, Inc" → "Laplink"
"Yorosis Technologies Inc" → "Yorosis Technologies"
"Wise Systems, Inc" → "Wise Systems"
"Deerhold Ltd" → "Deerhold"
"Rldatix Data Solutions Group" → "Rldatix"
"Tritech Software & Services" → "Tritech"
"Cognis Solutions Pvt Ltd" → "Cognis"
"Geek Genix Llc" → "Geek Genix"
"Abalta Technologies, Inc" → "Abalta Technologies"
"98point6 Technologies Inc" → "98point6"
"Copper" → "Copper"
"Whop" → "Whop"
"Instantly.Ai" → "Instantly.ai"
"Gnani.Ai" → "Gnani.ai"
"Solvex Dominicana, Srl" → "Solvex"
"Onecause, A Bonterra Company" → "Onecause"
"Ionic An Outsystems Company" → "Ionic"`;

export default function CleaningTab() {
    const { csvData, setCsvData, columnOrder } = useAppStore();
    const columns = columnOrder.length > 0 ? columnOrder : Object.keys(csvData[0] || {});

    const [openSection, setOpenSection] = useState<string | null>(null);
    const [caseCol, setCaseCol] = useState('');
    const [trimCol, setTrimCol] = useState('all');
    const [titleCaseCol, setTitleCaseCol] = useState('all');
    const [specialCharsCol, setSpecialCharsCol] = useState('all');
    const [companyCol, setCompanyCol] = useState('');
    const [isCleaningCompanies, setIsCleaningCompanies] = useState(false);
    const [cleaningProgress, setCleaningProgress] = useState({ done: 0, total: 0 });
    const toggle = (id: string) => setOpenSection(prev => prev === id ? null : id);

    //Text Cleaning
    const handleTrimWhitespace = () => {
        const newData = csvData.map(row => {
            if (trimCol === 'all') {
                const newRow: any = {};
                Object.keys(row).forEach(key => {
                    newRow[key] = typeof row[key] === 'string' ? row[key].trim() : row[key];
                });
                return newRow;
            } else {
                return {
                    ...row,
                    [trimCol]: typeof row[trimCol] === 'string' ? (row[trimCol] as string).trim() : row[trimCol]
                };
            }
        });
        setCsvData(newData);
    };
    const handleTitleCase = () => {
        const newData = csvData.map(row => {
            if (titleCaseCol == "all") {
                const newRow: any = {};
                Object.keys(row).forEach(key => {
                    newRow[key] = typeof row[key] === 'string'
                        ? row[key].replace(/\w\S*/g, (word: string) =>
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        : row[key];
                });
                return newRow;
            } else {
                return {
                    ...row,
                    [titleCaseCol]: typeof row[titleCaseCol] === 'string'
                        ? (row[titleCaseCol] as string).replace(/\w\S*/g, (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        : row[titleCaseCol]
                };
            }
        });
        setCsvData(newData);
    };
    const handleCase = (type: 'lower' | 'upper') => {
        if (!caseCol) return;
        const newData = csvData.map(row => {
            if (caseCol == "all") {
                const newRow: any = {};
                Object.keys(row).forEach(key => {
                    newRow[key] = typeof row[key] === 'string'
                        ? type === 'upper' ? (row[key] as string).toUpperCase() : (row[key] as string).toLowerCase()
                        : row[key]
                });
                return newRow;
            } else {
                return {
                    ...row,
                    [caseCol]: typeof row[caseCol] === 'string'
                        ? type === 'upper' ? (row[caseCol] as string).toUpperCase() : (row[caseCol] as string).toLowerCase()
                        : row[caseCol]
                }
            }
        });
        setCsvData(newData);
        toggle('case');
    };
    const handleRemoveSpecialChars = () => {
        const newData = csvData.map(row => {
            if (specialCharsCol == "all") {
                const newRow: any = {};
                Object.keys(row).forEach(key => {
                    newRow[key] = typeof row[key] === 'string'
                        ? row[key].replace(/[^\x20-\x7E]/g, '').trim()
                        : row[key];
                });
                return newRow;
            } else {
                return {
                    ...row,
                    [specialCharsCol]: typeof row[specialCharsCol] === "string" ? row[specialCharsCol].replace(/[^\x20-\x7E]/g, '').trim()
                        : row[specialCharsCol]
                }
            }
        });
        setCsvData(newData);
    };

    // Row Operations 
    const handleDeduplicate = () => {
        setTimeout(() => {
            const seen = new Set();
            const newData = csvData.filter(row => {
                const str = JSON.stringify(row);
                if (seen.has(str)) return false;
                seen.add(str);
                return true;
            });
            setCsvData(newData);
        }, 0)

    };
    const handleRemoveEmptyRows = () => {
        setTimeout(() => {
            const newData = csvData.filter(row =>
                Object.values(row).some(val => val !== null && val !== undefined && val !== '')
            );
            setCsvData(newData);
        }, 0)

    };

    // // Column Operations 
    // const handleSplitColumn = () => { };
    // const handleMergeColumns = () => { };

    // // Data Extraction 
    // const handleExtractDomain = () => { };
    // const handleExtractFirstName = () => { };
    // const handleFindReplace = () => { };

    // AI-Assisted 
    const handleCleanCompanyNames = async () => {
        if (!companyCol || !csvData.length) return;

        setIsCleaningCompanies(true);
        setCleaningProgress({ done: 0, total: csvData.length });

        const newData = [...csvData];
        const BATCH_SIZE = 10;
        const CONCURRENCY = 5;

        const processBatch = async (startIdx: number) => {
            const batch = [];
            const indices = [];

            for (let i = startIdx; i < Math.min(startIdx + BATCH_SIZE, newData.length); i++) {
                const raw = String(newData[i][companyCol] || '').trim();
                if (raw) {
                    batch.push(`${batch.length + 1}. ${raw}`);
                    indices.push(i);
                } else {
                    newData[i] = { ...newData[i], company_clean: '' };
                    setCleaningProgress(p => ({ ...p, done: p.done + 1 }));
                }
            }

            if (batch.length === 0) return;

            try {
                const response = await fetch('/api/openai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [
                            { role: 'system', content: PROMPT_BRAND_KEYWORDS },
                            { role: 'user', content: batch.join('\n') }
                        ],
                        max_tokens: 200,
                    }),
                });
                const data = await response.json();
                const lines = data.result?.trim().split('\n') || [];

                indices.forEach((rowIdx, i) => {
                    // parse "1. CompanyName" → "CompanyName"
                    const line = lines[i]?.replace(/^\d+\.\s*/, '').trim();
                    newData[rowIdx] = {
                        ...newData[rowIdx],
                        company_clean: line || String(newData[rowIdx][companyCol])
                    };
                });
            } catch {
                indices.forEach(rowIdx => {
                    newData[rowIdx] = {
                        ...newData[rowIdx],
                        company_clean: String(newData[rowIdx][companyCol])
                    };
                });
            }

            setCleaningProgress(p => ({ ...p, done: p.done + indices.length }));
            setCsvData([...newData]);
        };

        // build batch start indices
        const batchStarts = [];
        for (let i = 0; i < newData.length; i += BATCH_SIZE) {
            batchStarts.push(i);
        }

        // process batches with concurrency
        for (let i = 0; i < batchStarts.length; i += CONCURRENCY) {
            const chunk = batchStarts.slice(i, i + CONCURRENCY).map(start => processBatch(start));
            await Promise.all(chunk);
        }

        setIsCleaningCompanies(false);
    };
    // const handleNormalizeTitles = async () => { };

    return (
        <>
            {/* Text Operations */}
            < section className="space-y-2" >
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Text Operations</h3>

                {/* Trim Whitespace */}
                <button onClick={() => toggle('trim')} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all group text-left ${openSection === 'trim' ? 'bg-zinc-800 border-amber-500/50' : 'bg-zinc-900/50 border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5'}`}>
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><Scissors className="w-4 h-4" /></div>
                    <div className="flex-1">
                        <div className="text-xs font-medium text-zinc-200">Trim Whitespace</div>
                        <div className="text-[10px] text-zinc-500">Remove leading/trailing spaces</div>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${openSection === 'trim' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {openSection === 'trim' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="bg-zinc-900 border border-white/10 rounded-xl p-3 space-y-3">
                            <select value={trimCol} onChange={e => setTrimCol(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50">
                                <option value="all">All columns</option>
                                {columns.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                            <button onClick={handleTrimWhitespace}
                                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2">
                                <Play className="w-3 h-3" /> Run
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Title Case */}
                <button onClick={() => toggle('titlecase')} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all group text-left ${openSection === 'titlecase' ? 'bg-zinc-800 border-amber-500/50' : 'bg-zinc-900/50 border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5'}`}>
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><CaseSensitive className="w-4 h-4" /></div>
                    <div className="flex-1">
                        <div className="text-xs font-medium text-zinc-200">Title Case</div>
                        <div className="text-[10px] text-zinc-500">Capitalize first letter of each word</div>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${openSection === 'titlecase' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {openSection === 'titlecase' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="bg-zinc-900 border border-white/10 rounded-xl p-3 space-y-3">
                            <select value={titleCaseCol} onChange={e => setTitleCaseCol(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50">
                                <option value="all">All columns</option>
                                {columns.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                            <button onClick={handleTitleCase}
                                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2">
                                <Play className="w-3 h-3" /> Run
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Remove Special Characters */}
                <button onClick={() => toggle('specialchars')} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all group text-left ${openSection === 'specialchars' ? 'bg-zinc-800 border-amber-500/50' : 'bg-zinc-900/50 border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5'}`}>
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><Type className="w-4 h-4" /></div>
                    <div className="flex-1">
                        <div className="text-xs font-medium text-zinc-200">Remove Special Characters</div>
                        <div className="text-[10px] text-zinc-500">Strip weird unicode and symbols</div>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${openSection === 'specialchars' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {openSection === 'specialchars' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="bg-zinc-900 border border-white/10 rounded-xl p-3 space-y-3">
                            <select value={specialCharsCol} onChange={e => setSpecialCharsCol(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50">
                                <option value="all">All columns</option>
                                {columns.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                            <button onClick={handleRemoveSpecialChars}
                                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2">
                                <Play className="w-3 h-3" /> Run
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Lowercase / Uppercase */}
                <button onClick={() => toggle('case')} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all group text-left ${openSection === 'case' ? 'bg-zinc-800 border-amber-500/50' : 'bg-zinc-900/50 border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5'}`}>
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><CaseSensitive className="w-4 h-4" /></div>
                    <div className="flex-1">
                        <div className="text-xs font-medium text-zinc-200">Lowercase / Uppercase</div>
                        <div className="text-[10px] text-zinc-500">Apply to a specific column</div>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${openSection === 'case' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {openSection === 'case' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="bg-zinc-900 border border-white/10 rounded-xl p-3 space-y-3">
                            <select value={caseCol} onChange={e => setCaseCol(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50">
                                <option value="">Select column...</option>
                                {columns.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                            <div className="flex gap-2">
                                <button onClick={() => handleCase('lower')} disabled={!caseCol}
                                    className="flex-1 py-2 bg-zinc-800 hover:bg-amber-500/20 disabled:opacity-40 text-zinc-300 hover:text-amber-300 text-[10px] font-bold rounded-lg transition-all">
                                    lowercase
                                </button>
                                <button onClick={() => handleCase('upper')} disabled={!caseCol}
                                    className="flex-1 py-2 bg-zinc-800 hover:bg-amber-500/20 disabled:opacity-40 text-zinc-300 hover:text-amber-300 text-[10px] font-bold rounded-lg transition-all">
                                    UPPERCASE
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section >
            {/* Row Operations */}
            <section className="space-y-2">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Row Operations</h3>

                <button onClick={handleDeduplicate} className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group text-left">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><Eraser className="w-4 h-4" /></div>
                    <div>
                        <div className="text-xs font-medium text-zinc-200">Deduplicate</div>
                        <div className="text-[10px] text-zinc-500">Remove identical rows</div>
                    </div>
                </button>

                <button onClick={handleRemoveEmptyRows} className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group text-left">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><Rows3 className="w-4 h-4" /></div>
                    <div>
                        <div className="text-xs font-medium text-zinc-200">Remove Empty Rows</div>
                        <div className="text-[10px] text-zinc-500">Delete rows where all cells are blank</div>
                    </div>
                </button>
            </section>
            {/* AI Operations */}
            <section className="space-y-2">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">AI-Assisted</h3>

                <button onClick={() => toggle('company')} disabled={isCleaningCompanies}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all group text-left ${openSection === 'company' ? 'bg-zinc-800 border-emerald-500/50' : 'bg-zinc-900/50 border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5'}`}>
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><Wand2 className="w-4 h-4" /></div>
                    <div className="flex-1">
                        <div className="text-xs font-medium text-zinc-200">Clean Company Names</div>
                        <div className="text-[10px] text-zinc-500">Use AI to clean company names</div>
                    </div>
                    {isCleaningCompanies && (
                        <span className="text-[10px] text-emerald-400 font-mono">{cleaningProgress.done}/{cleaningProgress.total}</span>
                    )}
                </button>

                <AnimatePresence>
                    {openSection === 'company' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="bg-zinc-900 border border-white/10 rounded-xl p-3 space-y-3">
                            <p className="text-[10px] text-zinc-500">
                                Writes to a new <span className="text-zinc-300 font-mono">company_clean</span> column. Original is preserved.
                            </p>
                            <select value={companyCol} onChange={e => setCompanyCol(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50">
                                <option value="">Select column...</option>
                                {columns.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>

                            {isCleaningCompanies ? (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-zinc-400">Processing...</span>
                                        <span className="text-emerald-400 font-mono">{cleaningProgress.done} / {cleaningProgress.total}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-emerald-500 rounded-full"
                                            animate={{ width: `${(cleaningProgress.done / cleaningProgress.total) * 100}%` }}
                                            transition={{ type: 'spring', stiffness: 100 }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <button onClick={handleCleanCompanyNames} disabled={!companyCol}
                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2">
                                    <Play className="w-3 h-3" />
                                    Run Cleaner
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </>
    );
}