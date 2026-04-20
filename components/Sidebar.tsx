"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogOut, LayoutGrid, Plus, User as UserIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export const Sidebar = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    // console.log("===== SIDEBAR DEBUG =====");
    // console.log("pathname:", pathname);
    // console.log("user:", user);
    // console.log("Sidebar mounted");
  }, [pathname, user]);

  return (
    <aside className="w-20 bg-zinc-900 border-r border-white/10 flex flex-col shrink-0 z-[999] items-center py-4">
      {/* LOGO */}
      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0 mb-6 shadow-lg shadow-emerald-500/20">
        <span className="font-bold text-black text-xs">DF</span>
      </div>

      {/* NAV */}
      <nav className="flex-1 space-y-4 w-full px-2">
        {/* PROJECTS BUTTON */}
        <button
          onClick={() => router.push("/projects")}
          className={`w-full p-3 rounded-xl transition-all flex justify-center group relative ${pathname === "/projects" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white hover:bg-white/5"}`}
          title="Projects"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>
        {/* EMAIL INVITES */}
        <button
          onClick={() => router.push("/campaign")}
          className={`w-full p-3 rounded-xl transition-all flex justify-center group relative ${pathname === "/emailInvites" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white hover:bg-white/5"}`}
          title="Email Invites"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>
        {/* WORKSPACE BUTTON */}
        <button
          onClick={() => { router.push("/workspace"); }}
          className={`w-full p-3 rounded-xl transition-all flex justify-center group relative border ${pathname === "/workspace"
            ? "bg-white/20 text-white border-blue-500"
            : "text-zinc-300 hover:text-white hover:bg-white/10 border-transparent"
            }`}
          title="New Transformation"
        >
          <Plus className="w-6 h-6" />
        </button>

      </nav>

      {/* USER + LOGOUT */}
      <div className="pt-4 mt-auto border-t border-white/10 w-full px-2 space-y-4 flex flex-col items-center">
        {user?.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt="User"
            className="w-8 h-8 rounded-full border border-white/10"
            referrerPolicy="no-referrer"
            onLoad={() => console.log("Avatar loaded")}
            onError={() => console.log("Avatar failed")}
          />
        ) : (
          <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
            <UserIcon className="w-4 h-4" />
          </div>
        )}

        <button
          onClick={() => {
            console.log("Signing out...");
            signOut();
          }}
          className="w-full py-2 px-1 text-zinc-400 hover:text-red-400 transition-colors flex flex-col items-center gap-1 group"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};
