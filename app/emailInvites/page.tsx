"use client";

import { Sidebar } from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export default function EmailInvitesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // useEffect(() => {
    //     if (!loading && !user) router.push("/");
    // }, [user, loading]);

    // if (loading)
    //     return (
    //         <div className="h-screen bg-[#050505] flex items-center justify-center">
    //             <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
    //         </div>
    //     );

    return (
        <div className="h-screen bg-[#050505] text-white flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    {/* <h1 className="text-2xl font-semibold">Email Campaigns</h1>
                    <button className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg text-sm">
                        + New Campaign
                    </button> */}
                </div>

                {/* Campaign List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Campaign Card */}
                    <div className="bg-[#0b0b0b] border border-[#1a1a1a] rounded-2xl p-4 hover:border-emerald-500 transition">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-medium">Campaign Alpha</h2>
                            <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded">
                                Active
                            </span>
                        </div>

                        <p className="text-sm text-gray-400 mb-4">
                            Sending Google Meet invites to 120 recipients.
                        </p>

                        <div className="text-xs text-gray-500 mb-3">
                            Sent: 80 / 120
                        </div>

                        <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-emerald-500 w-[66%]" />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <button className="text-emerald-400 hover:underline">
                                View
                            </button>
                            <button className="text-red-400 hover:underline">
                                Stop
                            </button>
                        </div>
                    </div>

                    {/* Empty State Card */}
                    <div className="bg-[#0b0b0b] border border-dashed border-[#1a1a1a] rounded-2xl p-4 flex items-center justify-center text-gray-500">
                        No campaigns yet
                    </div>
                </div>
            </main>
        </div>
    );
}
