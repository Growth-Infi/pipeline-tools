'use client';

import { useState } from 'react';
import { Database, ShieldCheck, Eraser, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';
// import EmailVerificationPanel from './EmailVerificationPanel';
import DataToolsTab from './tabs/DataToolsTab';
import CleaningTab from './tabs/CleaningTab';

type ToolId = 'data' | 'clean' | 'verify';

interface Tool {
    id: ToolId;
    label: string;
    icon: any;
    color: string;
}

const TOOLS: Tool[] = [
    { id: 'data', label: 'Data Tools', icon: Database, color: 'text-blue-400' },
    { id: 'clean', label: 'Cleaning', icon: Eraser, color: 'text-amber-400' },
    // { id: 'verify', label: 'Verifier', icon: ShieldCheck, color: 'text-emerald-400' },
];

export default function TransformationControls() {
    const [activeTool, setActiveTool] = useState<ToolId>('data');

    return (
        <div className="h-full flex bg-[#080808]">
            {/* Left Strip */}
            <div className="w-14 flex-shrink-0 flex flex-col items-center py-4 border-r border-white/5 bg-[#050505] z-40 justify-between">
                <div className="space-y-4 w-full px-2">
                    {TOOLS.map((tool) => {
                        const Icon = tool.icon;
                        const isActive = activeTool === tool.id;
                        return (
                            <button
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id)}
                                title={tool.label}
                                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group ${isActive ? 'bg-white/10 text-white shadow-lg shadow-white/5' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                            >
                                <Icon className={`w-5 h-5 transition-colors ${isActive ? tool.color : 'text-current'}`} />
                                {isActive && (
                                    <motion.div
                                        layoutId="active-tool"
                                        className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${tool.color.replace('text-', 'bg-')}`}
                                    />
                                )}
                                <div className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                    {tool.label}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#080808]">
                <div className="h-12 border-b border-white/5 flex items-center px-4 justify-between shrink-0 bg-[#080808]/50 backdrop-blur-sm z-30">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        {TOOLS.find(t => t.id === activeTool)?.label}
                    </span>
                    <Settings2 className="w-3.5 h-3.5 text-zinc-600" />
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {/* {activeTool === 'verify' && <EmailVerificationPanel />} */}

                    {activeTool !== 'verify' && (
                        <motion.div
                            key={activeTool}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                        >
                            {activeTool === 'data' && <DataToolsTab />}
                            {activeTool === 'clean' && <CleaningTab />}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}