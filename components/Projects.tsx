'use client';

import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { decryptData } from '@/lib/crypto';
import { useState, useEffect } from 'react';
import { Loader2, Trash2, FileSpreadsheet, Calendar, ChevronRight, Search, LayoutTemplate, Clock, Database } from 'lucide-react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Projects() {
    const { user } = useAuth();
    const { setCsvData, setColumnOrder } = useAppStore();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingProjectIds, setLoadingProjectIds] = useState<string[]>([]);
    const router = useRouter();

    const fetchProjects = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('id, name, row_count, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error("Fetch projects error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [user]);

    const loadProject = async (project: any) => {
        if (loadingProjectIds.includes(project.id)) return;
        setLoadingProjectIds(prev => [...prev, project.id]);

        try {
            const { data, error } = await supabase
                .from('projects')
                .select('data')
                .eq('id', project.id)
                .single();

            if (error) throw error;

            const decrypted = decryptData(data.data)
            if (!decrypted) throw new Error('Failed to decrypt project data')

            const parsed = Papa.parse(decrypted, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            });
            const rows = parsed.data as any[];

            setCsvData(rows);
            setColumnOrder(Object.keys(rows[0]));

            router.push('/workspace');
        } catch (e: any) {
            console.error("Load error:", e);
            alert(`Failed to load project: ${e.message}`);
        } finally {
            setLoadingProjectIds(prev => prev.filter(id => id !== project.id));
        }
    };

    const deleteProject = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('This action cannot be undone. Delete project?')) return;
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setProjects(prev => prev.filter(p => p.id !== id));
        } catch (e) {
            console.error(e);
            alert("Delete failed");
        }
    };

    const filteredProjects = projects.filter(p =>
        (p.name || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <LayoutTemplate className="w-8 h-8 text-emerald-500" />
                        Projects
                        <span className="text-sm font-normal text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                            {projects.length}
                        </span>
                    </h2>
                    <p className="text-zinc-400 text-sm max-w-md">
                        Securely stored in Supabase. Click to load into workspace.
                    </p>
                </div>

                <div className="w-full md:w-auto flex gap-3">
                    <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search projects..."
                            className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-zinc-600"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                    <p className="text-zinc-500 text-sm animate-pulse">Loading projects...</p>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                        <Database className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No projects found</h3>
                    <p className="text-zinc-500 text-sm max-w-sm text-center mb-8">
                        {searchQuery ? "No matches for your search." : "Start a new transformation to save your first project."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                    <AnimatePresence>
                        {filteredProjects.map((project, index) => (
                            <motion.div
                                key={project.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => loadProject(project)}
                                className={`
                                    group relative bg-[#0d0d0d] border border-white/5 hover:border-emerald-500/30 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-1
                                    ${loadingProjectIds.includes(project.id) ? 'opacity-70 pointer-events-none shadow-none translate-y-0' : ''}
                                `}
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center shadow-lg group-hover:from-emerald-900/20 group-hover:to-emerald-900/10 transition-colors">
                                            {loadingProjectIds.includes(project.id) ? (
                                                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                                            ) : (
                                                <FileSpreadsheet className="w-6 h-6 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => deleteProject(project.id, e)}
                                            className="p-2 -mr-2 -mt-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete Project"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <h3 className="text-lg font-semibold text-white mb-2 truncate pr-2 group-hover:text-emerald-400 transition-colors">
                                        {project.name || 'Untitled Project'}
                                    </h3>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            <Database className="w-3.5 h-3.5" />
                                            <span>{project.row_count?.toLocaleString()} Rows</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{new Date(project.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric', month: 'short', day: 'numeric'
                                            })}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{new Date(project.created_at).toLocaleTimeString()}</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider group-hover:text-emerald-500/70 transition-colors">
                                            AES Secure
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}