'use client';

import { useAppStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { encryptData } from '@/lib/crypto';
import Papa from 'papaparse';
import { Loader2, CheckCircle, CloudUpload, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SaveProjectButton() {
    const { user } = useAuth();
    const { csvData } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [showNameInput, setShowNameInput] = useState(false);
    const [projectName, setProjectName] = useState('');

    const handleSave = async () => {
        if (!user || csvData.length === 0) return;

        if (!projectName && !showNameInput) {
            setProjectName(`Dataset ${new Date().toLocaleDateString()}`);
            setShowNameInput(true);
            return;
        }

        setLoading(true);
        setStatusMessage('Encrypting...');
        setShowNameInput(false);

        try {
            const csvString = Papa.unparse(csvData);
            const encrypted = encryptData(csvString);
            if (!encrypted) throw new Error('Encryption failed');

            setStatusMessage('Saving...');
            console.log('user id:', user.id);
            console.log('encrypted length:', encrypted.length);
            const { error } = await supabase.from('projects').insert({
                user_id: user.id,
                name: projectName || `Dataset ${new Date().toLocaleDateString()}`,
                data: encrypted,
                row_count: csvData.length,
            });

            if (error) throw error;

            setSaved(true);
            setProjectName('');
            setTimeout(() => setSaved(false), 3000);
        } catch (e: any) {
            console.error('Save Error:', e);
            alert(`Save Failed: ${e.message}`);
        } finally {
            setLoading(false);
            setStatusMessage('');
        }
    };

    if (!user) return null;

    return (
        <div className="relative">
            <AnimatePresence>
                {showNameInput && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-72 bg-[#111] border border-white/10 rounded-xl p-4 shadow-2xl z-50 ring-1 ring-white/5"
                    >
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Project Name</span>
                            <button onClick={() => setShowNameInput(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                        <input
                            autoFocus
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 mb-3"
                            placeholder="My Awesome Data Project"
                        />
                        <button
                            onClick={handleSave}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-black py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                            Confirm Save
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={handleSave}
                disabled={loading || saved}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wide min-w-[140px] justify-center
                    ${saved
                        ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                        : 'bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/50'
                    }
                `}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{statusMessage || 'Saving...'}</span>
                    </>
                ) : saved ? (
                    <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Saved
                    </>
                ) : (
                    <>
                        <CloudUpload className="w-3.5 h-3.5" />
                        Save Project
                    </>
                )}
            </button>
        </div>
    )
}
