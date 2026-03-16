'use client'

import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { signInWithGoogle, user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) router.push('/workspace')
  }, [user])

  if (loading) {
    return
    //make loading.tsx later
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
    </div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="relative min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center overflow-hidden bg-grid-pattern">
        <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-2xl mx-auto px-6 text-center"
        >
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
              <span className="text-white font-bold text-2xl">DF</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
            DataForge V2 <span className="text-emerald-500">AI</span>
          </h1>
          <p className="text-zinc-400 text-lg mb-10 max-w-lg mx-auto">
            The enterprise CSV transformation engine. Sign in to manage your data projects securely.
          </p>

          <button
            onClick={signInWithGoogle}
            className="relative px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-3 mx-auto shadow-xl hover:shadow-2xl hover:shadow-white/10"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Continue with Google
          </button>
        </motion.div>
      </main>
    </div>
  );
}
