'use client'

import { useAuth } from "@/context/AuthContext";
import { LogOut, LayoutGrid, Plus, User as UserIcon } from 'lucide-react';
import { usePathname, useRouter } from "next/navigation";

export const Sidebar = () => {
    const { user, signOut } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    return (
        <aside className="w-16 bg-zinc-900/40 backdrop-blur-xl border-r border-white/5 flex flex-col shrink-0 z-[100] items-center py-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0 mb-6 shadow-lg shadow-emerald-500/20">
                <span className="font-bold text-black text-xs">DF</span>
            </div>

            <nav className="flex-1 space-y-4 w-full px-2">
                <button
                    onClick={() => router.push('/projects')}
                    className={`w-full p-3 rounded-xl transition-all flex justify-center group relative ${pathname === '/projects' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                    title="Projects"
                >
                    <LayoutGrid className="w-5 h-5" />
                </button>

                <button
                    onClick={() => { router.push('/workspace'); }}
                    className={`w-full p-3 rounded-xl transition-all flex justify-center group relative ${pathname === '/workspace' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                    title="New Transformation"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </nav>

            <div className="pt-4 mt-auto border-t border-white/5 w-full px-2 space-y-4 flex flex-col items-center">
                {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="User" className="w-8 h-8 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                ) : (
                    <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center"><UserIcon className="w-4 h-4" /></div>
                )}

                <button
                    onClick={signOut}
                    className="w-full py-2 px-1 text-zinc-500 hover:text-red-400 transition-colors flex flex-col items-center gap-1 group"
                    title="Sign Out"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="text-[8px] font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Logout</span>
                </button>
            </div>
        </aside>
    )
}