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
  const [stats, setStats] = useState({
    total: 0,
    invited: 0,
    pending: 0,
    processing: 0,
    failed: 0,
  });
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

  const CURRENT_USER_ID = user?.id || "ed3e59b8-2e6c-44ea-9f7b-1c8248fa3973";
  const token =
    session?.access_token ||
    "eyJhbGciOiJFUzI1NiIsImtpZCI6IjI0ZmJiMGY3LWFjZDItNDg2NS1hOGNiLTQ4ZTVmYzQ1ODkwNCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2RyZXBndm1xZmhwb3h5ZGVxcnVuLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlZDNlNTliOC0yZTZjLTQ0ZWEtOWY3Yi0xYzgyNDhmYTM5NzMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgyNzAzMTk4LCJpYXQiOjE3ODI2OTk1OTgsImVtYWlsIjoidmVkYW50ZGVzaG11a2gzMTA4QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS3FGOWIzWTczYllMYkg4STBQa3FuMUM3cVlXak1OUGhYeHZVNDhsSlNkbnVkOEZBPXM5Ni1jIiwiZW1haWwiOiJ2ZWRhbnRkZXNobXVraDMxMDhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IlZlZGFudCBEZXNobXVraCIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJWZWRhbnQgRGVzaG11a2giLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLcUY5YjNZNzNiWUxiSDhJMFBrcW4xQzdxWVdqTU5QaFh4dlU0OGxKU2RudWQ4RkE9czk2LWMiLCJwcm92aWRlcl9pZCI6IjExNTAwNTI5NTczNzU3NjU2NjA1MyIsInN1YiI6IjExNTAwNTI5NTczNzU3NjU2NjA1MyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzgyMTExMjc0fV0sInNlc3Npb25faWQiOiIxNTY2NmI3MC03MjlmLTRmYzUtOWY4Yi1hODg0NDY0Y2U3OGEiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.QulS5AS59ys7egKxrwAyOWwYNzbBivSN3km1ONIIPrKQQsMHw9Vv2k-Nty1MQhnhktTAg6bCa8VvDUfEyIN04g";

  // --- REFS ---
  // tokenRef: always holds the latest token so intervals/callbacks
  // never close over a stale value from a previous render
  const tokenRef = useRef<string | undefined>(token);

  // campaignStatusRef: lets the setInterval callback read the current
  // campaign status without needing to re-create the interval
  const campaignStatusRef = useRef<string | null>(null);

  // recipientsPageRef: same idea — interval reads current page number
  // without a stale closure
  const recipientsPageRef = useRef(0);

  // intervalRef: holds the interval ID so we can clear it from anywhere
  // (cleanup, or when campaign completes)
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // didMountRef: skips the first run of the recipientsPage effect
  // so we don't duplicate the initial fetch that already runs in the
  // main polling effect
  const didMountRef = useRef(false);

  // Keep tokenRef in sync with the latest token on every render.
  // This runs synchronously after each render, so by the time any
  // async callback reads tokenRef.current it always has the fresh value.
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Keep recipientsPageRef in sync with state
  useEffect(() => {
    recipientsPageRef.current = recipientsPage;
  }, [recipientsPage]);

  // --- MAIN POLLING EFFECT ---
  // All three fetch functions are defined INSIDE this effect.
  // This means they close over `tokenRef` (not `token` directly),
  // so they always call tokenRef.current at the moment they run —
  // which is always the latest value.
  //
  // If `token` or `id` changes, React tears down this effect (clearing
  // the interval) and re-runs it fresh. Clean and correct.

  // useEffect(() => {
  //     if (!authLoading && !user) router.push("/");
  // }, [user, authLoading]);
  useEffect(() => {
    if (authLoading || !token) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/campaign/${id}/stats`, {
          headers: { Authorization: `Bearer ${tokenRef.current}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };

    const fetchRecipients = async (page: number) => {
      try {
        setRecipientsLoading(true);
        const offset = page * PAGE_SIZE;
        const res = await fetch(
          `${API_BASE}/campaign/${id}/recipients?limit=${PAGE_SIZE}&offset=${offset}`,
          { headers: { Authorization: `Bearer ${tokenRef.current}` } },
        );
        if (!res.ok) return;
        const json = await res.json();
        setRecipients(json.data);
        setRecipientsTotal(json.total);
      } catch (err) {
        console.error("Failed to fetch recipients", err);
      } finally {
        setRecipientsLoading(false);
      }
    };

    const fetchCampaign = async () => {
      try {
        const res = await fetch(`${API_BASE}/campaign/${id}`, {
          headers: { Authorization: `Bearer ${tokenRef.current}` },
        });
        if (!res.ok) throw new Error("Not found");
        const data: Campaign = await res.json();

        campaignStatusRef.current = data.status;
        setCampaign(data);

        if (data.status === "completed") {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // One final fetch of recipients when campaign completes
          fetchRecipients(recipientsPageRef.current);
        }
      } catch (err) {
        console.error("Failed to fetch campaign", err);
        setError("Failed to load campaign");
      } finally {
        setLoading(false);
      }
    };

    // if (authLoading)
    //   return (
    //     <div className="h-screen bg-[#050505] flex items-center justify-center">
    //       <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
    //     </div>
    //   );
    // Initial load — fire everything in parallel
    const init = async () => {
      await Promise.all([fetchCampaign(), fetchRecipients(0), fetchStats()]);
    };
    init();

    // Poll every 8 seconds
    intervalRef.current = setInterval(() => {
      fetchCampaign();
      fetchStats();
      // Only poll recipients while running — saves unnecessary requests
      if (campaignStatusRef.current === "running") {
        fetchRecipients(recipientsPageRef.current);
      }
    }, 8000);

    // Cleanup: clear the interval when effect re-runs or component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [id, token, authLoading]); // re-runs if campaign id or token changes

  // --- PAGINATION EFFECT ---
  // Fires when the user clicks Prev/Next. We skip the very first run
  // (didMountRef) because the main effect above already fetches page 0
  // on mount — running it twice would cause a duplicate request.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (!token || !id) return;

    const fetchRecipientsForPage = async (page: number) => {
      try {
        setRecipientsLoading(true);
        const offset = page * PAGE_SIZE;
        const res = await fetch(
          `${API_BASE}/campaign/${id}/recipients?limit=${PAGE_SIZE}&offset=${offset}`,
          { headers: { Authorization: `Bearer ${tokenRef.current}` } },
        );
        if (!res.ok) return;
        const json = await res.json();
        setRecipients(json.data);
        setRecipientsTotal(json.total);
      } catch (err) {
        console.error("Failed to fetch recipients", err);
      } finally {
        setRecipientsLoading(false);
      }
    };

    fetchRecipientsForPage(recipientsPage);
  }, [recipientsPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const groupedRecipients = recipients.reduce(
    (acc, recipient) => {
      const sender = recipient.sender_email || "Not Assigned";
      if (!acc[sender]) acc[sender] = [];
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

    campaignStatusRef.current = optimisticStatus;
    setCampaign((prev) =>
      prev ? { ...prev, status: optimisticStatus } : prev,
    );

    try {
      const res = await fetch(`${API_BASE}/campaign/${campaign.id}/${action}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          // Use tokenRef.current here too — handleAction can be called
          // long after the component mounted, token may have refreshed
          Authorization: `Bearer ${tokenRef.current}`,
        },
        body:
          action === "start"
            ? JSON.stringify({ user_id: campaign.user_id })
            : undefined,
      });

      if (!res.ok) throw new Error();
    } catch {
      campaignStatusRef.current = previousStatus;
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
    <div className="h-screen bg-[#050505] text-white flex flex-col md:flex-row overflow-hidden relative">
      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>

      <main className="w-full md:flex-1 overflow-y-auto p-4 sm:p-8">
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
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white mb-2 break-all">
                  {campaign.name}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border capitalize inline-block ${status.classes}`}
                >
                  {status.label}
                </span>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                {(campaign.status === "pending" ||
                  campaign.status === "draft") && (
                  <ActionButton
                    label="Start Campaign"
                    icon={<Play className="w-4 h-4" />}
                    color="bg-emerald-600 hover:bg-emerald-500 w-full sm:w-auto"
                    loading={actionLoading === "start"}
                    onClick={() => handleAction("start")}
                  />
                )}
                {campaign.status === "running" && (
                  <ActionButton
                    label="Pause Campaign"
                    icon={<Pause className="w-4 h-4" />}
                    color="bg-yellow-600 hover:bg-yellow-500 w-full sm:w-auto"
                    loading={actionLoading === "pause"}
                    onClick={() => handleAction("pause")}
                  />
                )}
                {campaign.status === "paused" && (
                  <ActionButton
                    label="Resume Campaign"
                    icon={<RotateCcw className="w-4 h-4" />}
                    color="bg-blue-600 hover:bg-blue-500 w-full sm:w-auto"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 flex items-start gap-4 bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 min-w-0">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                  <Link2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Meet Link
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono">
                    <span className="truncate">
                      {campaign.meeting_link?.replace(/^https?:\/\//, "")}
                    </span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 min-w-0">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                  <Play className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Start Time
                  </p>
                  <p className="text-xs text-zinc-200 font-mono break-words">
                    {campaign.start_time
                      ? formatDate(campaign.start_time, campaign.timezone)
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 min-w-0">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                  <Pause className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    End Time
                  </p>
                  <p className="text-xs text-zinc-200 font-mono break-words">
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

              <div className="flex items-start gap-4 bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 min-w-0">
                <div className="p-2 rounded-xl bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Created
                  </p>
                  <p className="text-xs text-zinc-500 font-mono break-words">
                    {formatDate(campaign.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex justify-center">
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 w-full max-w-xl">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Delivery Progress
                  </h2>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {stats.total > 0
                      ? `${Math.round((stats.invited / stats.total) * 100)}%`
                      : "0%"}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex mb-4">
                  {stats.total > 0 && (
                    <>
                      <motion.div
                        className="h-full bg-emerald-500"
                        animate={{
                          width: `${(stats.invited / stats.total) * 100}%`,
                        }}
                        transition={{ duration: 0.5 }}
                      />
                      <motion.div
                        className="h-full bg-blue-500"
                        animate={{
                          width: `${(stats.processing / stats.total) * 100}%`,
                        }}
                        transition={{ duration: 0.5 }}
                      />
                      <motion.div
                        className="h-full bg-red-500/70"
                        animate={{
                          width: `${(stats.failed / stats.total) * 100}%`,
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    {
                      label: "Invited",
                      value: stats.invited,
                      color: "text-emerald-400",
                      dot: "bg-emerald-500",
                    },
                    {
                      label: "Pending",
                      value: stats.pending,
                      color: "text-zinc-400",
                      dot: "bg-zinc-500",
                    },
                    {
                      label: "Processing",
                      value: stats.processing,
                      color: "text-blue-400",
                      dot: "bg-blue-500",
                    },
                    {
                      label: "Failed",
                      value: stats.failed,
                      color: "text-red-400",
                      dot: "bg-red-500",
                    },
                  ].map(({ label, value, color, dot }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1 py-3 rounded-xl bg-black/30 border border-white/5"
                    >
                      <span
                        className={`text-base font-bold font-mono ${color}`}
                      >
                        {value}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                        <span className="text-[9px] text-zinc-600 uppercase tracking-wider">
                          {label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {campaign?.status === "running" && stats.pending > 0 && (
                  <p className="text-[9px] text-zinc-600 mt-3 text-center font-mono">
                    ~{Math.ceil(stats.pending / 20)} batch
                    {Math.ceil(stats.pending / 20) !== 1 ? "es" : ""} remaining
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
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
                        className="border border-white/5 rounded-2xl overflow-hidden bg-zinc-950/40"
                      >
                        <div className="bg-zinc-900/80 px-4 py-3 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-xs font-semibold truncate ${
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
                              className="grid grid-cols-2 px-4 py-3 text-xs gap-2 min-w-0 items-center"
                            >
                              <span className="text-zinc-200 truncate pr-2">
                                {r.email}
                              </span>
                              <span className="text-zinc-500 capitalize truncate">
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
