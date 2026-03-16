'use client';

import { Sidebar } from '@/components/Sidebar';
import Projects from '@/components/Projects';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function ProjectsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [user, loading]);

    if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
    </div>;
    return (
        <div className="h-screen bg-[#050505] text-white flex overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <Projects />
            </main>
        </div>
    );
}