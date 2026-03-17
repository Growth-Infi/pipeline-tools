"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppStore } from "@/lib/store";
import { exportCSV } from "@/lib/csv-utils";
import { Sidebar } from "@/components/Sidebar";
import FileUpload from "@/components/FileUpload";
import DataTable from "@/components/DataTable";
import TransformationControls from "@/components/TramsformationControls";
import SaveProjectButton from "@/components/SaveProjectButton";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";

export default function WorkspacePage() {
  const { csvData } = useAppStore();
  const { user, loading } = useAuth();
  const router = useRouter();

  // ✅ FIXED AUTH HANDLING
  useEffect(() => {
    if (loading) return; // ⛔ wait for auth to finish

    if (!user) {
      console.log("No user → redirecting");
      router.push("/");
    }
  }, [user, loading]);

  // ✅ LOADING STATE
  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ✅ CRITICAL: prevent render until user exists
  if (!user) return null;

  return (
    <div className="h-screen bg-[#050505] text-white flex">
      <Sidebar />

      <div className="flex-1 flex h-full overflow-hidden">
        {csvData.length > 0 && (
          <div className="w-[28rem] border-r border-white/5 bg-[#080808] z-30 flex flex-col h-full shrink-0 shadow-xl shadow-black/50">
            <TransformationControls />
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          <header className="px-6 py-3 bg-[#050505]/95 backdrop-blur-sm border-b border-white/5 flex justify-between items-center shrink-0 z-50">
            <div>
              <h2 className="font-semibold text-white text-sm">Workspace</h2>
              <p className="text-[10px] text-zinc-500">
                {csvData.length > 0 ? `${csvData.length} Rows Loaded` : "Ready"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {csvData.length > 0 && (
                <button
                  onClick={() => exportCSV(csvData, "dataforge-export.csv")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs bg-white/5 hover:bg-white/10"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              )}
              <SaveProjectButton />
            </div>
          </header>

          <div className="flex-1 overflow-hidden bg-[#080808]">
            {csvData.length === 0 ? <FileUpload /> : <DataTable />}
          </div>
        </div>
      </div>
    </div>
  );
}
