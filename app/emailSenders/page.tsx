"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import {
  Mail,
  Loader2,
  AlertCircle,
  Plus,
  ToggleLeft,
  ToggleRight,
  Clock,
  Send,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_MEET_INVITE_BACKEND_URL;

interface EmailSender {
  id: string;
  user_id: string;
  email: string;
  daily_limit: number;
  sent_today: number;
  last_sent_at: string | null;
  status: "active" | "paused" | "needs_reauth";
  created_at: string;
  next_send_at: string | null;
}

export default function EmailSendersPage() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const [senders, setSenders] = useState<EmailSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [limitMap, setLimitMap] = useState<Record<string, number>>({});
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  // const CURRENT_USER_ID = user?.id;
  // const token = session?.access_token;
  const CURRENT_USER_ID = user?.id || "ed3e59b8-2e6c-44ea-9f7b-1c8248fa3973";
  const token =
    session?.access_token ||
    "eyJhbGciOiJFUzI1NiIsImtpZCI6IjI0ZmJiMGY3LWFjZDItNDg2NS1hOGNiLTQ4ZTVmYzQ1ODkwNCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2RyZXBndm1xZmhwb3h5ZGVxcnVuLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlZDNlNTliOC0yZTZjLTQ0ZWEtOWY3Yi0xYzgyNDhmYTM5NzMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc5MTk4MDg3LCJpYXQiOjE3NzkxOTQ0ODcsImVtYWlsIjoidmVkYW50ZGVzaG11a2gzMTA4QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS3FGOWIzWTczYllMYkg4STBQa3FuMUM3cVlXak1OUGhYeHZVNDhsSlNkbnVkOEZBPXM5Ni1jIiwiZW1haWwiOiJ2ZWRhbnRkZXNobXVraDMxMDhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IlZlZGFudCBEZXNobXVraCIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJWZWRhbnQgRGVzaG11a2giLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLcUY5YjNZNzNiWUxiSDhJMFBrcW4xQzdxWVdqTU5QaFh4dlU0OGxKU2RudWQ4RkE9czk2LWMiLCJwcm92aWRlcl9pZCI6IjExNTAwNTI5NTczNzU3NjU2NjA1MyIsInN1YiI6IjExNTAwNTI5NTczNzU3NjU2NjA1MyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzc4NTA1MDIxfV0sInNlc3Npb25faWQiOiI2ZDk2MGIzOS1lMzI3LTRjNWYtOWMwMC02MGFiZGM4NmU5Y2EiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.iMCN5b2mHckycV5dKRp2Ybcgx9p1gNTAVd42Xb-BLJ2p_NqEvTmJkJrcaQKeMRdwOcnOQVhAoletqNTeuv9hpg";

  // useEffect(() => {
  //     if (!authLoading && !user) router.push("/");
  // }, [user, authLoading]);

  useEffect(() => {
    if (authLoading || !CURRENT_USER_ID) return;
    const fetchSenders = async () => {
      try {
        //get sender mails
        const res = await fetch(`${API_BASE}/gmail/accounts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setSenders(data);
      } catch {
        setError("Failed to load email senders");
      } finally {
        setLoading(false);
      }
    };
    fetchSenders();
  }, [CURRENT_USER_ID, authLoading]);

  const handleToggle = async (sender: EmailSender) => {
    if (sender.status === "needs_reauth") {
      handleAddSender();
      return;
    }
    setTogglingId(sender.id);
    const newStatus = sender.status === "active" ? "paused" : "active";

    // optimistic
    setSenders((prev) =>
      prev.map((s) => (s.id === sender.id ? { ...s, status: newStatus } : s)),
    );

    try {
      //update status of email
      const res = await fetch(`${API_BASE}/gmail/${sender.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, user_id: CURRENT_USER_ID }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // rollback
      setSenders((prev) =>
        prev.map((s) =>
          s.id === sender.id ? { ...s, status: sender.status } : s,
        ),
      );
    } finally {
      setTogglingId(null);
    }
  };
  const handleDisconnect = async (senderId: string) => {
    const previousSenders = senders;
    //optimistic remove
    setSenders((prev) => prev.filter((s) => s.id !== senderId));
    setDisconnectingId(senderId);

    try {
      const res = await fetch(`${API_BASE}/gmail/${senderId}/disconnect`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to disconnect");
      }
    } catch (err) {
      console.error(err);

      // rollback
      setSenders(previousSenders);

      alert("Failed to disconnect Gmail account");
    } finally {
      setDisconnectingId(null);
    }
  };
  const handleAddSender = async () => {
    try {
      const res = await fetch(`${API_BASE}/gmail/connect`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Unauthorized");

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to connect:", err);
      setError("Could not initialize Gmail connection. Please try again.");
    }
    // window.location.href = `${API_BASE}/gmail/connect`;
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

  // if (authLoading || loading) return (
  //     <div className="h-screen bg-[#050505] flex items-center justify-center">
  //         <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
  //     </div>
  // );

  const handleUpdateDailyLimit = async (senderId: string) => {
    const limit = limitMap[senderId];

    if (limit < 1 || limit > 60) {
      alert("Limit must be between 1 and 60");
      return;
    }

    setUpdatingId(senderId);

    try {
      const res = await fetch(`${API_BASE}/gmail/${senderId}/limit`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          daily_limit: limit,
          user_id: CURRENT_USER_ID,
        }),
      });

      if (!res.ok) throw new Error();

      //  update UI
      setSenders((prev) =>
        prev.map((s) => (s.id === senderId ? { ...s, daily_limit: limit } : s)),
      );

      //  CLEANUP
      setLimitMap((prev) => {
        const copy = { ...prev };
        delete copy[senderId];
        return copy;
      });

      setEditingId(null);
    } catch {
      alert("Failed to update limit");
    } finally {
      setUpdatingId(null);
    }
  };
  return (
    <div className="h-screen bg-[#050505] text-white flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">
              Email Senders
            </h1>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Manage Gmail accounts used for outreach
            </p>
          </div>
          <button
            onClick={handleAddSender}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition-all text-xs font-bold text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Gmail Account
          </button>
        </div>

        {error && (
          <div className="flex items-center justify-center h-64 gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">{error}</span>
          </div>
        )}

        {!error && senders.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-600">
            <Mail className="w-8 h-8 opacity-30" />
            <p className="text-xs">No email senders added yet</p>
            <button
              onClick={handleAddSender}
              className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              + Add your first Gmail account
            </button>
          </div>
        )}

        {!error && senders.length > 0 && (
          <div className="space-y-2">
            {senders.map((sender, i) => {
              const pct =
                sender.daily_limit > 0
                  ? Math.round((sender.sent_today / sender.daily_limit) * 100)
                  : 0;

              return (
                <motion.div
                  key={sender.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-[#0b0b0b] border border-[#1a1a1a] rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-500/10">
                          <Mail className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <p className="text-xs font-medium text-zinc-200 truncate">
                          {sender.email}
                        </p>
                        <span
                          className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-md border capitalize ${
                            sender.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : sender.status === "needs_reauth"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                          }`}
                        >
                          {sender.status === "needs_reauth"
                            ? "Re-auth required"
                            : sender.status}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500">
                          {/* LEFT SIDE */}
                          <div className="flex items-center gap-2">
                            <Send className="w-3 h-3" />
                            <span>Daily usage</span>

                            {editingId === sender.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={
                                    limitMap[sender.id] ?? sender.daily_limit
                                  }
                                  min={1}
                                  max={60}
                                  step={1}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);

                                    setLimitMap((prev) => ({
                                      ...prev,
                                      [sender.id]: val,
                                    }));
                                  }}
                                  className="w-16 px-1 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[10px] focus:outline-none"
                                  autoFocus
                                />

                                <button
                                  onClick={() =>
                                    handleUpdateDailyLimit(sender.id)
                                  }
                                  disabled={updatingId === sender.id}
                                  className="text-[9px] px-2 py-0.5 bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50"
                                >
                                  {updatingId === sender.id ? "..." : "Save"}
                                </button>

                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-[9px] text-zinc-400 hover:text-white"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingId(sender.id);
                                  setLimitMap((prev) => ({
                                    ...prev,
                                    [sender.id]: sender.daily_limit,
                                  }));
                                }}
                                className="text-[9px] text-blue-400 hover:text-blue-300"
                              >
                                Edit
                              </button>
                            )}
                          </div>

                          {/* RIGHT SIDE */}
                          <span className="font-mono">
                            {sender.sent_today} / {sender.daily_limit}
                          </span>
                        </div>
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handleDisconnect(sender.id)}
                            disabled={disconnectingId === sender.id}
                            title="Disconnect Sender"
                            className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                          >
                            {disconnectingId === sender.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="w-3.5 h-3.5" />
                                {/* <span>Disconnect</span> */}
                              </>
                            )}
                          </button>
                        </div>
                        {/* PROGRESS BAR */}
                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              pct > 80
                                ? "bg-red-500"
                                : pct > 50
                                  ? "bg-yellow-500"
                                  : "bg-emerald-500"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-[10px] text-zinc-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            Last sent: {formatDate(sender.last_sent_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => handleToggle(sender)}
                        disabled={togglingId === sender.id}
                        title={
                          sender.status === "active"
                            ? "Pause account"
                            : sender.status === "paused"
                              ? "Activate account"
                              : "Reconnect Gmail"
                        }
                        className="shrink-0 text-zinc-400 hover:text-white transition-colors disabled:opacity-40"
                      >
                        {togglingId === sender.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : sender.status === "needs_reauth" ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-[10px] font-bold border border-red-500/20">
                            <RefreshCw className="w-3 h-3" />
                            Reconnect
                          </div>
                        ) : sender.status === "active" ? (
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-zinc-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
