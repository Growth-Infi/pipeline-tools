'use client';

import { useAppStore } from '@/lib/store';
import { parseCSV } from '@/lib/csv-utils';
import { Upload, FileUp, Sparkles } from 'lucide-react';
import { useCallback, useState, useRef } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function FileUpload() {
    const { setCsvData, setColumnOrder } = useAppStore();
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(async (file: File) => {
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            alert('Please upload a CSV file');
            return;
        }

        setIsLoading(true);
        try {
            const data = await parseCSV(file);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Cinematic delay

            if (data.length > 0) {
                setCsvData(data);
                // Initial column order
                setColumnOrder(Object.keys(data[0]));
            }
        } catch (error) {
            console.error('Error parsing CSV:', error);
            alert('Failed to parse CSV file');
        } finally {
            setIsLoading(false);
        }
    }, [setCsvData, setColumnOrder]);

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const triggerClick = () => fileInputRef.current?.click();

    return (
        <div className="relative w-full max-w-lg mx-auto">
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center justify-center p-12 bg-white/5 backdrop-blur-xl border border-emerald-500/20 rounded-2xl shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)]"
                    >
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                            <Sparkles className="w-10 h-10 text-emerald-400 relative z-10 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-mono text-emerald-400 mb-2 tracking-widest">INITIALIZING_ENGINE</h3>
                        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-emerald-500"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                            />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={triggerClick}
                        className={clsx(
                            "group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 border",
                            isDragging
                                ? "bg-emerald-900/10 scale-[1.02] border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                                : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                        )}
                    >
                        {/* Visual Grid Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                        <div className="relative z-10 p-12 flex flex-col items-center text-center">
                            <div className={clsx(
                                "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 shadow-2xl ring-1 ring-white/10",
                                isDragging ? "bg-emerald-500 text-white rotate-6 scale-110 shadow-emerald-500/20" : "bg-black/40 text-zinc-400 group-hover:scale-110 group-hover:bg-zinc-800 group-hover:text-white"
                            )}>
                                <FileUp className="w-7 h-7" strokeWidth={1.5} />
                            </div>

                            <h3 className="text-xl font-medium text-white mb-2 tracking-tight">
                                Drop CSV or <span className="text-emerald-400 underline decoration-1 underline-offset-4 group-hover:text-emerald-300 transition-colors">Browse</span>
                            </h3>
                            <p className="text-xs text-zinc-500 font-mono group-hover:text-zinc-400 transition-colors tracking-widest uppercase">
                                Secure Local Processing
                            </p>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={onChange}
                            className="hidden"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
