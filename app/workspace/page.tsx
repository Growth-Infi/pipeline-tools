'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppStore } from '@/lib/store';
import { exportCSV } from '@/lib/csv-utils';
import { Sidebar } from '@/components/Sidebar';
import FileUpload from '@/components/FileUpload';
import DataTable from '@/components/DataTable';
import TransformationControls from '@/components/TramsformationControls';
import SaveProjectButton from '@/components/SaveProjectButton';
// import ApiKeyInput from '@/components/ApiKeyInput';
// import Dashboard from '@/components/Dashboard';
import { useRouter } from 'next/navigation';
import { Download } from 'lucide-react';

export default function WorkspacePage() {
    const { csvData } = useAppStore();
    const { user, loading } = useAuth()
    const router = useRouter()
    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [user, loading]);
    if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
    </div>;
    return (
        <div className="h-screen bg-[#050505] text-white flex overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex h-full overflow-hidden">
                {/* LEFT SIDEBAR */}
                {csvData.length > 0 && (
                    <div className="w-[28rem] border-r border-white/5 bg-[#080808] z-30 flex flex-col h-full shrink-0 shadow-xl shadow-black/50">
                        <TransformationControls />
                    </div>
                )}

                {/* MAIN AREA */}
                <div className="flex-1 flex flex-col min-w-0 h-full relative">
                    <header className="px-6 py-3 bg-[#050505]/95 backdrop-blur-sm border-b border-white/5 flex justify-between items-center shrink-0 z-50">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <h2 className="font-semibold text-white tracking-tight text-sm">Workspace</h2>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                    {csvData.length > 0 ? `${csvData.length} Rows Loaded` : 'Ready'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* <ApiKeyInput /> */}
                            <div className="h-4 w-px bg-white/10" />
                            {csvData.length > 0 && (
                                <button
                                    onClick={() => exportCSV(csvData, 'dataforge-export.csv')}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/10 hover:border-white/20 transition-all"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Export CSV
                                </button>
                            )}
                            <div className="h-4 w-px bg-white/10" />
                            <SaveProjectButton />
                        </div>
                    </header>

                    <div className="flex-1 overflow-hidden relative p-0 bg-[#080808]">
                        {csvData.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-8">
                                <FileUpload />
                            </div>
                        ) : (
                            <DataTable />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}