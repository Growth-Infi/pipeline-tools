"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Users,
  Calendar,
  Link2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_MEET_INVITE_BACKEND_URL;

interface Campaign {
  id: string;
  user_id: string;
  name: string;
  meeting_link: string;
  status: "running" | "paused" | "completed" | "pending" | "draft";
  created_at: string;
  recipients?: { count: number }[]; // ✅ NEW
}

interface Recipient {
  id: string;
  email: string;
  status: string;
  error?: string;
  sent_at?: string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  running: {
    label: "Running",
    classes: "bg-blue-500/10 text-blue-400 border-blue-500/20", //  Blue
  },
  paused: {
    label: "Paused",
    classes: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", // Yellow
  },
  draft: {
    label: "Draft",
    classes: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", // Yellow
  },
  completed: {
    label: "Completed",
    classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", // Green
  },
  pending: {
    label: "Pending",
    classes: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
};
export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]); // ✅ NEW

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const CURRENT_USER_ID = user?.id || "ed3e59b8-2e6c-44ea-9f7b-1c8248fa3973";

  // useEffect(() => {
  //     if (!authLoading && !user) router.push("/");
  // }, [user, authLoading]);

  useEffect(() => {
    if (authLoading) return;
    if (!CURRENT_USER_ID) return;

    const fetchCampaign = async () => {
      try {
        // ✅ FIXED: direct campaign fetch
        const res = await fetch(
          `${API_BASE}/campaign/${id}?user_id=${CURRENT_USER_ID}`,
        );
        const data: Campaign = await res.json();

        if (!data) throw new Error("Not found");

        console.log("CAMPAIGN:", data);
        setCampaign(data);

        //  NEW: fetch recipients
        const resRecipients = await fetch(
          `${API_BASE}/campaign/${id}/recipients`,
        );
        const recipientsData: Recipient[] = await resRecipients.json();

        console.log("RECIPIENTS:", recipientsData);
        setRecipients(recipientsData);

        // const res = await fetch(`${API_BASE}/${id}`);
        // const data = await res.json();
        // if (!data) throw new Error("Not found");
        // setCampaign(data);
      } catch (err) {
        console.log(err);
        setError("Failed to load campaign");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id, CURRENT_USER_ID, authLoading]);

  // if (authLoading) return (
  //     <div className="h-screen bg-[#050505] flex items-center justify-center">
  //         <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
  //     </div>
  // );

  const handleAction = async (action: "start" | "pause" | "resume") => {
    if (!campaign) return;
    setActionLoading(action);
    setActionError("");

    const optimisticStatus =
      action === "start"
        ? "running"
        : action === "pause"
          ? "paused"
          : "running";

    const previousStatus = campaign.status;

    setCampaign((prev) =>
      prev ? { ...prev, status: optimisticStatus } : prev,
    );

    try {
      const res = await fetch(`${API_BASE}/campaign/${campaign.id}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body:
          action === "start"
            ? JSON.stringify({ user_id: campaign.user_id })
            : undefined,
      });

      if (!res.ok) throw new Error();
    } catch {
      setCampaign((prev) =>
        prev ? { ...prev, status: previousStatus } : prev,
      );
      setActionError(`Failed to ${action} campaign`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "Never";

    const date = new Date(iso + "Z");

    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ❌ old total_recipients removed
  const totalRecipients = campaign?.recipients?.[0]?.count || 0;

  const status = campaign
    ? statusConfig[campaign.status] || statusConfig.pending
    : null;

  return (
    <div className="h-screen bg-[#050505] text-white flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-auto p-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to campaigns
        </button>

        {loading && (
          <div className="flex items-center justify-center h-64 gap-2 text-zinc-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Loading…</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64 gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">{error}</span>
          </div>
        )}

        {!loading && !error && campaign && status && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Title row */}
            <div className="flex items-start justify-between gap-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {campaign.name}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border capitalize ${status.classes}`}
                >
                  {status.label}
                </span>
              </div>

              {/* Action button — right side of header */}
              <div className="flex flex-col items-end gap-2">
                {(campaign.status === "pending" ||
                  campaign.status === "draft") && (
                  <ActionButton
                    label="Start Campaign"
                    icon={<Play className="w-4 h-4" />}
                    color="bg-emerald-600 hover:bg-emerald-500"
                    loading={actionLoading === "start"}
                    onClick={() => handleAction("start")}
                  />
                )}
                {campaign.status === "running" && (
                  <ActionButton
                    label="Pause Campaign"
                    icon={<Pause className="w-4 h-4" />}
                    color="bg-yellow-600 hover:bg-yellow-500"
                    loading={actionLoading === "pause"}
                    onClick={() => handleAction("pause")}
                  />
                )}
                {campaign.status === "paused" && (
                  <ActionButton
                    label="Resume Campaign"
                    icon={<RotateCcw className="w-4 h-4" />}
                    color="bg-blue-600 hover:bg-blue-500"
                    loading={actionLoading === "resume"}
                    onClick={() => handleAction("resume")}
                  />
                )}
                {campaign.status === "completed" && (
                  <p className="text-[10px] text-zinc-600">
                    Campaign completed
                  </p>
                )}
                {actionError && (
                  <p className="text-[10px] text-red-400">{actionError}</p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/5" />

            {/* Details grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  <Link2 className="w-3 h-3" />
                  Meet Link
                </div>
                <a
                  href={campaign.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-mono transition-colors break-all"
                >
                  {campaign.meeting_link?.replace("https://", "")}
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>

              {/* ✅ FIXED recipients */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  <Users className="w-3 h-3" />
                  Recipients
                </div>
                <p className="text-xs text-zinc-300 font-mono">
                  {totalRecipients} total
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  <Calendar className="w-3 h-3" />
                  Created
                </div>
                <p className="text-xs text-zinc-300">
                  {formatDate(campaign.created_at)}
                </p>
              </div>
            </div>

            {/* ✅ OPTIONAL recipients list */}
            <div className="mt-6">
              <h2 className="text-xs text-zinc-500 mb-2">Recipients</h2>
              <div className="space-y-2">
                {recipients.map((r) => (
                  <div
                    key={r.id}
                    className="text-xs bg-zinc-900 p-2 rounded flex justify-between"
                  >
                    <span>{r.email}</span>
                    <span className="text-zinc-500">{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  color,
  loading,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${color}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}
