import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from 'lucide-react';

const OPENAI_MODELS = [
    { id: 'gpt-4o-mini', label: 'GPT-4o mini', badge: 'Fast' },
    { id: 'gpt-4o', label: 'GPT-4o', badge: 'Smart' },
    { id: 'gpt-4.1', label: 'GPT-4.1', badge: null },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini', badge: null },
    { id: 'gpt-4.1-nano', label: 'GPT-4.1 nano', badge: 'Cheapest' },
    { id: 'o4-mini', label: 'o4-mini', badge: 'Reasoning' },
];

export function ModelPicker({ value, onChange }: { value: string; onChange: (m: string) => void }) {
    const [open, setOpen] = useState(false);
    const selected = OPENAI_MODELS.find(m => m.id === value) ?? OPENAI_MODELS[0];

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2 bg-black border border-white/10 rounded-lg text-xs text-white hover:border-violet-500/40 transition-colors"
            >
                <span className="flex items-center gap-2">
                    <span>{selected.label}</span>
                    {selected.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
                            {selected.badge}
                        </span>
                    )}
                </span>
                <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.ul
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.1 }}
                        className="absolute z-50 top-full mt-1 w-full bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                        {OPENAI_MODELS.map(m => (
                            <li
                                key={m.id}
                                onClick={() => { onChange(m.id); setOpen(false); }}
                                className={`px-3 py-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors ${m.id === value ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-300 hover:bg-white/5'}`}
                            >
                                <span>{m.label}</span>
                                {m.badge && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-500">
                                        {m.badge}
                                    </span>
                                )}
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}