"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
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
const PAGE_SIZE = 50;

interface Campaign {
  id: string;
  user_id: string;
  name: string;
  meeting_link: string;
  status: "running" | "paused" | "completed" | "pending" | "draft";
  created_at: string;
  start_time?: string;
  end_time?: string;
  timezone?: string;
  recipients?: { count: number }[];
}

interface Recipient {
  id: string;
  email: string;
  status: string;
  error?: string;
  sent_at?: string;
  sender_email: string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  running: {
    label: "Running",
    classes: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  paused: {
    label: "Paused",
    classes: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  draft: {
    label: "Draft",
    classes: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  completed: {
    label: "Completed",
    classes: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  pending: {
    label: "Pending",
    classes: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading, session } = useAuth();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientsTotal, setRecipientsTotal] = useState(0);
  const [recipientsPage, setRecipientsPage] = useState(0);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  // Refs to hold interval IDs so fetchCampaign can clear them
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recipientIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const CURRENT_USER_ID = user?.id || "ed3e59b8-2e6c-44ea-9f7b-1c8248fa3973";
  const token =
    session?.access_token ||
    "eyJhbGciOiJFUzI1NiIsImtpZCI6IjI0ZmJiMGY3LWFjZDItNDg2NS1hOGNiLTQ4ZTVmYzQ1ODkwNCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2RyZXBndm1xZmhwb3h5ZGVxcnVuLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlZDNlNTliOC0yZTZjLTQ0ZWEtOWY3Yi0xYzgyNDhmYTM5NzMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc4ODMxOTQ5LCJpYXQiOjE3Nzg4MjgzNDksImVtYWlsIjoidmVkYW50ZGVzaG11a2gzMTA4QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS3FGOWIzWTczYllMYkg4STBQa3FuMUM3cVlXak1OUGhYeHZVNDhsSlNkbnVkOEZBPXM5Ni1jIiwiZW1haWwiOiJ2ZWRhbnRkZXNobXVraDMxMDhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IlZlZGFudCBEZXNobXVraCIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJWZWRhbnQgRGVzaG11a2giLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLcUY5YjNZNzNiWUxiSDhJMFBrcW4xQzdxWVdqTU5QaFh4dlU0OGxKU2RudWQ4RkE9czk2LWMiLCJwcm92aWRlcl9pZCI6IjExNTAwNTI5NTczNzU3NjU2NjA1MyIsInN1YiI6IjExNTAwNTI5NTczNzU3NjU2NjA1MyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzc4NTA1MDIxfV0sInNlc3Npb25faWQiOiI2ZDk2MGIzOS1lMzI3LTRjNWYtOWMwMC02MGFiZGM4NmU5Y2EiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.fwcMQpin_yDFsy8fNi4yLKxTktrc01-nB9kecQYZbzXS8CMaRd9I2Ah23d9vRFcqP3ro1oi-3YltXF2tizDEOQ";

  // useEffect(() => {
  //     if (!authLoading && !user) router.push("/");
  // }, [user, authLoading]);

  const stopAllPolling = () => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
    if (recipientIntervalRef.current) {
      clearInterval(recipientIntervalRef.current);
      recipientIntervalRef.current = null;
    }
  };

  const stopRecipientPolling = () => {
    if (recipientIntervalRef.current) {
      clearInterval(recipientIntervalRef.current);
      recipientIntervalRef.current = null;
    }
  };

  const fetchRecipients = async (page: number) => {
    try {
      setRecipientsLoading(true);
      const offset = page * PAGE_SIZE;
      const res = await fetch(
        `${API_BASE}/campaign/${id}/recipients?limit=${PAGE_SIZE}&offset=${offset}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const json = await res.json();
      console.log("Recipients Fetched ", json);

      setRecipients(json.data);
      setRecipientsTotal(json.total);
    } catch (err) {
      console.error("Failed to fetch recipients", err);
    } finally {
      setRecipientsLoading(false);
    }
  };

  const fetchCampaign = async (currentPage: number) => {
    try {
      const res = await fetch(`${API_BASE}/campaign/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Campaign = await res.json();
      if (!data) throw new Error("Not found");
      console.log("Campaign Fetched ", data);

      setCampaign((prev) => {
        // If status changed from running → something else, adjust recipient polling
        if (prev?.status === "running" && data.status !== "running") {
          console.log(" Stopping Recipient polling, campaign status changed");

          stopRecipientPolling();
        }
        return data;
      });

      if (data.status === "completed") {
        console.log("Campaign completed, Stopping all polling");

        // Campaign is done — no point polling anything anymore
        stopAllPolling();
        // Do one final recipients fetch to get final state
        fetchRecipients(currentPage);
      }
    } catch (err) {
      console.error("Failed to fetch campaign", err);
      setError("Failed to load campaign");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (authLoading || !CURRENT_USER_ID) return;

    // Initial fetches
    fetchCampaign(recipientsPage);
    fetchRecipients(recipientsPage);

    console.log("Starting Campaign polling");

    // Always poll campaign status every 3s to catch status changes
    statusIntervalRef.current = setInterval(
      () => fetchCampaign(recipientsPage),
      3000,
    );

    if (campaign?.status === "running") {
      console.log("Starting Recipient polling");

      recipientIntervalRef.current = setInterval(
        () => fetchRecipients(recipientsPage),
        3000,
      );
    }

    return () => stopAllPolling();
  }, [id, CURRENT_USER_ID, authLoading, recipientsPage]);

  // if (authLoading) return (
  //     <div className="h-screen bg-[#050505] flex items-center justify-center">
  //         <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
  //     </div>
  // );

  useEffect(() => {
    if (!campaign) return;

    if (campaign.status === "running") {
      // Start recipient polling if not already running
      if (!recipientIntervalRef.current) {
        console.log("Starting recipient polling");
        recipientIntervalRef.current = setInterval(
          () => fetchRecipients(recipientsPage),
          3000,
        );
      }
    } else {
      // Not running — stop recipient polling
      console.log(" Stopping Recipient polling, campaign status changed");

      stopRecipientPolling();
    }
  }, [campaign?.status]);

  const groupedRecipients = recipients.reduce(
    (acc, recipient) => {
      const sender = recipient.sender_email || "Not Assigned";

      if (!acc[sender]) {
        acc[sender] = [];
      }

      acc[sender].push(recipient);

      return acc;
    },
    {} as Record<string, Recipient[]>,
  );

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

  const formatDate = (iso: string | null, campaignTz?: string) => {
    if (!iso) return "—";
    if (campaignTz) {
      const utcDate = fromZonedTime(iso, campaignTz);
      return `${formatInTimeZone(utcDate, campaignTz, "MMM d, yyyy · HH:mm")} · ${campaignTz}`;
    }
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const totalRecipients = campaign?.recipients?.[0]?.count || 0;

  const status = campaign
    ? statusConfig[campaign.status] || statusConfig.pending
    : null;

  const totalPages = Math.ceil(recipientsTotal / PAGE_SIZE);

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

            <div className="border-t border-white/5" />

            {/* Details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex items-start gap-4 bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                  <Link2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Meet Link
                  </p>
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
              </div>

              <div className="flex items-start gap-4 bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Start Time
                  </p>
                  <p className="text-xs text-zinc-200 font-mono">
                    {campaign.start_time
                      ? formatDate(campaign.start_time, campaign.timezone)
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                  <Pause className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    End Time
                  </p>
                  <p className="text-xs text-zinc-200 font-mono">
                    {campaign.end_time
                      ? formatDate(campaign.end_time, campaign.timezone)
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Recipients
                  </p>
                  <p className="text-xs text-zinc-200 font-mono">
                    {totalRecipients} total
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4">
                <div className="p-2 rounded-xl bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Created
                  </p>
                  <p className="text-xs text-zinc-500 font-mono">
                    {formatDate(campaign.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Recipients list */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs text-zinc-500 uppercase tracking-wider">
                  Recipients by Sender
                </h2>
                {recipientsTotal > 0 && (
                  <span className="text-[10px] text-zinc-600">
                    {recipientsTotal} total · showing{" "}
                    {recipientsPage * PAGE_SIZE + 1}-
                    {Math.min(
                      (recipientsPage + 1) * PAGE_SIZE,
                      recipientsTotal,
                    )}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-4 py-2 border-b border-white/5">
                <span>Email</span>
                <span>Status</span>
              </div>

              {recipientsLoading && recipients.length === 0 ? (
                <div className="flex items-center justify-center h-24 gap-2 text-zinc-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-[10px]">Loading recipients…</span>
                </div>
              ) : (
                <div className="space-y-6 mt-4">
                  {Object.entries(groupedRecipients).map(
                    ([senderEmail, senderRecipients]) => (
                      <div
                        key={senderEmail}
                        className="border border-white/5 rounded-2xl overflow-hidden"
                      >
                        <div className="bg-zinc-900/80 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                          <div>
                            <p
                              className={`text-xs font-semibold ${
                                senderEmail === "Not Assigned"
                                  ? "text-zinc-400"
                                  : "text-[#b8a98a]"
                              }`}
                            >
                              {senderEmail}
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-1">
                              {senderEmail === "Not Assigned"
                                ? `${senderRecipients.length} recipients unassigned`
                                : `${senderRecipients.length} recipients assigned`}
                            </p>
                          </div>
                        </div>
                        <div className="divide-y divide-white/5">
                          {senderRecipients.map((r) => (
                            <div
                              key={r.id}
                              className="grid grid-cols-2 px-4 py-3 text-xs"
                            >
                              <span className="text-zinc-200">{r.email}</span>
                              <span className="text-zinc-500 capitalize">
                                {r.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}

              {/* Pagination */}
              {recipientsTotal > PAGE_SIZE && (
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setRecipientsPage((p) => Math.max(0, p - 1))}
                    disabled={recipientsPage === 0 || recipientsLoading}
                    className="text-[10px] px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="text-[10px] text-zinc-600">
                    Page {recipientsPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setRecipientsPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={
                      (recipientsPage + 1) * PAGE_SIZE >= recipientsTotal ||
                      recipientsLoading
                    }
                    className="text-[10px] px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
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
