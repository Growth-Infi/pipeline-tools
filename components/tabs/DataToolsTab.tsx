'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Database, ArrowUpDown, ChevronDown, Columns } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DataToolsTab() {
    const { csvData, setCsvData, columnOrder, setColumnOrder, setHiddenCols, hiddenCols } = useAppStore();
    const columns = columnOrder.length > 0 ? columnOrder : Object.keys(csvData[0] || {});

    const [openSection, setOpenSection] = useState<string | null>(null);
    const toggle = (id: string) => setOpenSection(prev => prev === id ? null : id);

    const handleSort = (col: string, asc: boolean) => {
        const sorted = [...csvData].sort((a, b) => {
            const valA = a[col] ?? '';
            const valB = b[col] ?? '';
            if (valA < valB) return asc ? -1 : 1;
            if (valA > valB) return asc ? 1 : -1;
            return 0;
        });
        setCsvData(sorted);
    };

    const handleToggleColumn = (col: string) => {
        setHiddenCols(
            hiddenCols.includes(col) ? hiddenCols.filter(c => c !== col) : [...hiddenCols, col]
        );
    };

    return (
        <div className="p-4 space-y-6">
            {/* Stats Card */}
            <section>
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Dataset Statistics</span>
                        <Database className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-2xl font-mono text-white font-bold">{csvData.length.toLocaleString()}</div>
                            <div className="text-[10px] text-blue-300/60 font-medium uppercase">Total Rows</div>
                        </div>
                        <div>
                            <div className="text-2xl font-mono text-white font-bold">{columns.length}</div>
                            <div className="text-[10px] text-blue-300/60 font-medium uppercase">Columns</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sort */}
            <section className="space-y-2">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Sort</h3>
                <button onClick={() => toggle('sort')} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all group text-left ${openSection === 'sort' ? 'bg-zinc-800 border-blue-500/50' : 'bg-zinc-900/50 border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5'}`}>
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><ArrowUpDown className="w-4 h-4" /></div>
                    <div className="flex-1">
                        <div className="text-xs font-medium text-zinc-200">Sort by Column</div>
                        <div className="text-[10px] text-zinc-500">Ascending or descending</div>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${openSection === 'sort' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {openSection === 'sort' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="bg-zinc-900 border border-white/10 rounded-xl p-3 space-y-1 max-h-48 overflow-y-auto">
                            {columns.map(col => (
                                <div key={col} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg group">
                                    <span className="text-xs text-zinc-300 truncate max-w-[140px]">{col}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleSort(col, true)}
                                            className="px-2 py-1 bg-zinc-800 hover:bg-blue-500 hover:text-white text-zinc-400 text-[9px] font-bold rounded transition-colors">
                                            ASC
                                        </button>
                                        <button onClick={() => handleSort(col, false)}
                                            className="px-2 py-1 bg-zinc-800 hover:bg-blue-500 hover:text-white text-zinc-400 text-[9px] font-bold rounded transition-colors">
                                            DESC
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* Hide/Show Columns */}
            <section className="space-y-2">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Columns</h3>
                <button onClick={() => toggle('columns')} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all group text-left ${openSection === 'columns' ? 'bg-zinc-800 border-blue-500/50' : 'bg-zinc-900/50 border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5'}`}>
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Columns className="w-4 h-4" /></div>
                    <div className="flex-1">
                        <div className="text-xs font-medium text-zinc-200">Hide / Show Columns</div>
                        <div className="text-[10px] text-zinc-500">{hiddenCols.length > 0 ? `${hiddenCols.length} hidden` : 'All columns visible'}</div>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${openSection === 'columns' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {openSection === 'columns' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="bg-zinc-900 border border-white/10 rounded-xl p-3 space-y-1 max-h-48 overflow-y-auto">
                            {columns.map(col => (
                                <div key={col} onClick={() => handleToggleColumn(col)}
                                    className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                                    <span className={`text-xs truncate max-w-[160px] transition-colors ${hiddenCols.includes(col) ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>
                                        {col}
                                    </span>
                                    <div className={`w-3 h-3 rounded-full border transition-colors ${hiddenCols.includes(col) ? 'border-zinc-600 bg-transparent' : 'bg-blue-500 border-blue-500'}`} />
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
}