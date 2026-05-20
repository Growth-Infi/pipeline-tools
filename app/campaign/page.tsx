"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import {
  Megaphone,
  Loader2,
  AlertCircle,
  Mail,
  ChevronRight,
  CalendarDays,
  LayoutGrid,
  ChevronLeft,
  X,
  Play,
  Globe,
  Clock,
  Calendar,
  AlignLeft,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import TimezoneSelect from "@/components/TimezoneSelect";
import { useAppStore } from "@/lib/store";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
const API_BASE = process.env.NEXT_PUBLIC_MEET_INVITE_BACKEND_URL;

interface Campaign {
  id: string;
  user_id: string;
  name: string;
  meeting_link: string;
  total_recipients: number;
  sent_count: number;
  status: "running" | "paused" | "completed" | "pending" | "draft";
  created_at: string;
  start_time?: string;
  timezone?: string;
}

const statusColors: Record<string, string> = {
  running: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  paused: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  draft: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  completed: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  pending: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const statusDotColors: Record<string, string> = {
  running: "bg-emerald-400",
  paused: "bg-yellow-400",
  draft: "bg-yellow-400",
  completed: "bg-violet-400",
  pending: "bg-blue-400",
};

// ─── helpers ────────────────────────────────────────────────────────────────

const formatToDateTimeLocal = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDate = (iso: string | null, timezone?: string) => {
  if (!iso) return "Never";
  return formatInTimeZone(new Date(iso), timezone || "UTC", "MMM d, h:mm a");
};

// ─── Quick-create modal (extracted from EmailInvitesTab) ─────────────────────

function CreateCampaignModal({
  onClose,
  prefillDate,
}: {
  onClose: () => void;
  prefillDate?: Date;
}) {
  const { csvData, columnOrder } = useAppStore();
  const { user, session } = useAuth();

  const CURRENT_USER_ID = user?.id || "ed3e59b8-2e6c-44ea-9f7b-1c8248fa3973";
  const token =
    session?.access_token ||
    "eyJhbGciOiJFUzI1NiIsImtpZCI6IjI0ZmJiMGY3LWFjZDItNDg2NS1hOGNiLTQ4ZTVmYzQ1ODkwNCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2RyZXBndm1xZmhwb3h5ZGVxcnVuLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlZDNlNTliOC0yZTZjLTQ0ZWEtOWY3Yi0xYzgyNDhmYTM5NzMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc5MjQ0NTc4LCJpYXQiOjE3NzkyNDA5NzgsImVtYWlsIjoidmVkYW50ZGVzaG11a2gzMTA4QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS3FGOWIzWTczYllMYkg4STBQa3FuMUM3cVlXak1OUGhYeHZVNDhsSlNkbnVkOEZBPXM5Ni1jIiwiZW1haWwiOiJ2ZWRhbnRkZXNobXVraDMxMDhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IlZlZGFudCBEZXNobXVraCIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJWZWRhbnQgRGVzaG11a2giLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLcUY5YjNZNzNiWUxiSDhJMFBrcW4xQzdxWVdqTU5QaFh4dlU0OGxKU2RudWQ4RkE9czk2LWMiLCJwcm92aWRlcl9pZCI6IjExNTAwNTI5NTczNzU3NjU2NjA1MyIsInN1YiI6IjExNTAwNTI5NTczNzU3NjU2NjA1MyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzc5MjQwOTc4fV0sInNlc3Npb25faWQiOiJlYTFiMjZiZC03OTk0LTRiNzEtOWI4OC04NGZkY2UzNzVjOWMiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ._ToiwR-prRBy8IhEV46uTI-pNMZt07mFiJnIs01lwEZDpEfUqX3XfdkfQQlfrI_8uGAwflEhKsjt4n6igQBiQA";

  const initStart = prefillDate
    ? formatToDateTimeLocal(prefillDate)
    : formatToDateTimeLocal(new Date());

  const initEnd = (() => {
    const d = prefillDate ? new Date(prefillDate) : new Date();
    d.setMinutes(d.getMinutes() + 30);
    return formatToDateTimeLocal(d);
  })();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [emailCol, setEmailCol] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [startTime, setStartTime] = useState(initStart);
  const [endTime, setEndTime] = useState(initEnd);
  const [senders, setSenders] = useState<any[]>([]);
  const [selectedSenderIds, setSelectedSenderIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSenders, setFetchingSenders] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const columns = (
    columnOrder.length > 0 ? columnOrder : Object.keys(csvData[0] || {})
  ).filter((col) => col.toLowerCase() !== "status");

  useEffect(() => {
    const kw = ["email", "mail"];
    const detected = columns.find((col) =>
      kw.some((k) => col.toLowerCase().includes(k)),
    );
    if (!emailCol && detected) setEmailCol(detected);
  }, [columns]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/gmail/accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSenders(data.filter((s: any) => s.status === "active"));
      } catch {
      } finally {
        setFetchingSenders(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (startTime) {
      const d = new Date(startTime);
      d.setMinutes(d.getMinutes() + 30);
      setEndTime(formatToDateTimeLocal(d));
    }
  }, [startTime]);

  const canSubmit =
    name.trim() &&
    eventTitle.trim() &&
    meetLink.trim() &&
    emailCol &&
    selectedSenderIds.length > 0 &&
    !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    const emailList = csvData
      .map((row) => String(row[emailCol] || "").trim())
      .filter(Boolean);
    const payload = {
      user_id: CURRENT_USER_ID,
      name: name.trim(),
      description: description.trim(),
      event_title: eventTitle.trim(),
      meeting_link: meetLink.trim(),
      timezone,
      start_time: startTime + ":00",
      end_time: endTime + ":00",
      emails: emailList,
      sender_ids: selectedSenderIds,
    };
    try {
      const res = await fetch(`${API_BASE}/campaign/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch {
      setError("Failed to create campaign. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-lg bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5 bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Launch Campaign
              </h2>
              <p className="text-[10px] text-zinc-500 font-medium">
                {prefillDate
                  ? `Scheduled for ${prefillDate.toLocaleDateString(undefined, { month: "long", day: "numeric" })}`
                  : "Configure meeting and outreach details"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {success ? (
            <div className="flex items-center justify-center py-12 text-emerald-400 text-sm font-medium">
              ✓ Campaign created successfully!
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Megaphone className="w-3 h-3" /> Campaign Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Q2 Sales Demo"
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Event Title
                  </label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Introduction to Product"
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                  <AlignLeft className="w-3 h-3" /> Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context..."
                  rows={2}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Meet Link
                  </label>
                  <input
                    type="url"
                    value={meetLink}
                    onChange={(e) => setMeetLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-rose-500/50 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Email Column
                  </label>
                  <select
                    value={emailCol}
                    onChange={(e) => setEmailCol(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-rose-500/50"
                  >
                    <option value="">Select column...</option>
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <hr className="border-white/5" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-rose-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3" /> End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-rose-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Timezone
                </label>
                <TimezoneSelect value={timezone} onChange={setTimezone} />
              </div>

              {/* Sender multi-select */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Select Sender Accounts
                </label>
                <div className="grid grid-cols-1 gap-1.5 p-3 bg-black border border-white/10 rounded-xl max-h-28 overflow-y-auto">
                  {fetchingSenders ? (
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <Loader2 className="w-3 h-3 animate-spin" /> Loading
                      senders...
                    </div>
                  ) : senders.length > 0 ? (
                    senders.map((s) => {
                      const isSelected = selectedSenderIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-all group ${
                            isSelected
                              ? "bg-rose-500/10 border-rose-500/40"
                              : "bg-zinc-900/40 border-white/5 hover:border-white/20 hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div
                              className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${isSelected ? "bg-rose-500/20 text-rose-300" : "bg-zinc-800 text-zinc-400"}`}
                            >
                              {s.email?.[0]?.toUpperCase()}
                            </div>
                            <span
                              className={`text-[11px] truncate ${isSelected ? "text-rose-200" : "text-zinc-400 group-hover:text-zinc-200"}`}
                            >
                              {s.email}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) =>
                              setSelectedSenderIds(
                                e.target.checked
                                  ? [...selectedSenderIds, s.id]
                                  : selectedSenderIds.filter(
                                      (id) => id !== s.id,
                                    ),
                              )
                            }
                            className="accent-rose-500 w-4 h-4"
                          />
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-[10px] text-amber-500/80">
                      No active senders. Connect one in Senders page.
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-[10px] text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        {!success && (
          <div className="p-4 sm:p-5 border-t border-white/5 bg-[#0a0a0a] flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 sm:px-5 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-5 sm:px-6 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Start Campaign
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Calendar view ────────────────────────────────────────────────────────────

function CalendarView({
  campaigns,
  onDayClick,
  onCampaignClick,
}: {
  campaigns: Campaign[];
  onDayClick: (date: Date) => void;
  onCampaignClick: (id: string) => void;
}) {
  const today = new Date();
  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [popover, setPopover] = useState<{
    key: string;
    campaigns: Campaign[];
  } | null>(null);
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const formatCampaignTime = (iso?: string, campaignTz?: string) => {
    if (!iso) return "";
    const utcDate = fromZonedTime(iso, campaignTz || "UTC");
    return formatInTimeZone(utcDate, userTz, "HH:mm");
  };

  const campaignsByDate: Record<string, Campaign[]> = {};
  campaigns.forEach((c) => {
    const raw = c.start_time || c.created_at;
    if (!raw) return;
    const campaignTz = c.timezone || "UTC";
    const utcDate = fromZonedTime(raw, campaignTz);
    const key = formatInTimeZone(utcDate, userTz, "yyyy-M-d");
    if (!campaignsByDate[key]) campaignsByDate[key] = [];
    campaignsByDate[key].push(c);
  });

  const monthName = viewDate.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  // Build a plain flat list of active days specifically for the mobile viewport stack display
  const activeDaysList = Object.keys(campaignsByDate)
    .filter((key) => {
      const [cYear, cMonth] = key.split("-").map(Number);
      return cYear === year && cMonth === month + 1;
    })
    .sort((a, b) => Number(a.split("-")[2]) - Number(b.split("-")[2]));

  return (
    <div className="flex flex-col h-full">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
          {monthName}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* DESKTOP CALENDAR GRID SYSTEM */}
      <div className="hidden md:flex flex-col flex-1">
        <div className="grid grid-cols-7 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="text-center text-[9px] font-bold text-zinc-600 uppercase tracking-widest py-1"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 flex-1">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} />;
            }

            const key = `${year}-${month + 1}-${day}`;
            const dayCampaigns = campaignsByDate[key] || [];
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() === month &&
              today.getDate() === day;
            const isPast =
              new Date(year, month, day) <
              new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <div
                key={key}
                onClick={() => {
                  if (dayCampaigns.length === 0) {
                    const clickedDate = new Date(year, month, day, 10, 0);
                    onDayClick(clickedDate);
                  }
                }}
                className={`relative min-h-[72px] rounded-xl border p-1.5 text-left transition-all group flex flex-col
                  ${
                    isToday
                      ? "border-rose-500/40 bg-rose-500/5"
                      : dayCampaigns.length > 0
                        ? "border-white/10 bg-white/[0.02] cursor-default"
                        : isPast
                          ? "border-white/[0.03] bg-transparent opacity-40 cursor-default"
                          : "border-white/5 bg-white/[0.01] hover:border-white/20 hover:bg-white/5 cursor-pointer"
                  }`}
              >
                <span
                  className={`text-[10px] font-bold mb-1 ${isToday ? "text-rose-400" : "text-zinc-500"}`}
                >
                  {day}
                </span>

                <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
                  {dayCampaigns.slice(0, 2).map((c) => (
                    <button
                      key={c.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCampaignClick(c.id);
                      }}
                      className={`w-full text-left px-1.5 py-0.5 rounded text-[8px] font-semibold truncate flex items-center gap-1 transition-all hover:brightness-125
                        ${statusColors[c.status] || statusColors.pending}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotColors[c.status] || "bg-blue-400"}`}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[7px] opacity-70 leading-none">
                          {formatCampaignTime(c.start_time, c.timezone)}
                        </span>
                        <span className="truncate leading-none mt-0.5">
                          {c.name}
                        </span>
                      </div>
                    </button>
                  ))}
                  {dayCampaigns.length > 2 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPopover({ key, campaigns: dayCampaigns });
                      }}
                      className="w-full text-left px-1.5 py-0.5 rounded text-[8px] font-bold text-zinc-400 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all"
                    >
                      +{dayCampaigns.length - 2} more
                    </button>
                  )}
                </div>

                {dayCampaigns.length === 0 && !isPast && (
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-medium">
                    + New
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MOBILE SCROLLABLE TIMELINE VIEW STACK */}
      <div className="flex md:hidden flex-col gap-3 max-h-[450px] overflow-y-auto pr-1">
        {activeDaysList.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-500">
            No campaigns scheduled for this month
          </div>
        ) : (
          activeDaysList.map((dateKey) => {
            const dayNum = dateKey.split("-")[2];
            const dayCampaigns = campaignsByDate[dateKey] || [];
            return (
              <div
                key={dateKey}
                className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex gap-3 items-start"
              >
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold rounded-lg text-xs w-8 h-8 flex items-center justify-center shrink-0">
                  {dayNum}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  {dayCampaigns.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onCampaignClick(c.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between border transition-all ${statusColors[c.status] || statusColors.pending}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotColors[c.status] || "bg-blue-400"}`}
                        />
                        <span className="truncate font-semibold text-white">
                          {c.name}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-60 ml-2 shrink-0 font-mono">
                        {formatCampaignTime(c.start_time, c.timezone)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legend layout adjustments */}
      <div className="flex items-center gap-x-3 gap-y-1.5 mt-4 px-1 flex-wrap border-t border-white/5 pt-3">
        {Object.entries(statusDotColors).map(([status, dot]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            <span className="text-[9px] text-zinc-600 capitalize">
              {status}
            </span>
          </div>
        ))}
        <div className="hidden sm:flex items-center gap-1.5 ml-auto">
          <span className="text-[9px] text-zinc-600">
            Click empty date to create campaign
          </span>
        </div>
      </div>

      {/* Day overflow popover */}
      <AnimatePresence>
        {popover && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setPopover(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 6 }}
              transition={{ duration: 0.12 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-900/50">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {popover.campaigns.length} campaigns
                </span>
                <button
                  onClick={() => setPopover(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
                {popover.campaigns.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setPopover(null);
                      onCampaignClick(c.id);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border flex items-center gap-3 transition-all hover:brightness-125 ${statusColors[c.status] || statusColors.pending}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${statusDotColors[c.status] || "bg-blue-400"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold truncate">
                        {c.name}
                      </p>
                      <p className="text-[9px] opacity-60 mt-0.5">
                        {formatCampaignTime(c.start_time, c.timezone)}
                      </p>
                    </div>
                    <ChevronRight className="w-3 h-3 opacity-40 shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type ViewMode = "list" | "calendar";
export default function EmailInvitesPage() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [prefillDate, setPrefillDate] = useState<Date | undefined>();

  const CURRENT_USER_ID = user?.id || "ed3e59b8-2e6c-44ea-9f7b-1c8248fa3973";
  const token =
    session?.access_token ||
    "eyJhbGciOiJFUzI1NiIsImtpZCI6IjI0ZmJiMGY3LWFjZDItNDg2NS1hOGNiLTQ4ZTVmYzQ1ODkwNCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2RyZXBndm1xZmhwb3h5ZGVxcnVuLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlZDNlNTliOC0yZTZjLTQ0ZWEtOWY3Yi0xYzgyNDhmYTM5NzMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc5MjQ0NTc4LCJpYXQiOjE3NzkyNDA5NzgsImVtYWlsIjoidmVkYW50ZGVzaG11a2gzMTA4QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS3FGOWIzWTczYllMYkg4STBQa3FuMUM3cVlXak1OUGhYeHZVNDhsSlNkbnVkOEZBPXM5Ni1jIiwiZW1haWwiOiJ2ZWRhbnRkZXNobXVraDMxMDhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IlZlZGFudCBEZXNobXVraCIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJWZWRhbnQgRGVzaG11a2giLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLcUY5YjNZNzNiWUxiSDhJMFBrcW4xQzdxWVdqTU5QaFh4dlU0OGxKU2RudWQ4RkE9czk2LWMiLCJwcm92aWRlcl9pZCI6IjExNTAwNTI5NTczNzU3NjU2NjA1MyIsInN1YiI6IjExNTAwNTI5NTczNzU3NjU2NjA1MyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzc5MjQwOTc4fV0sInNlc3Npb25faWQiOiJlYTFiMjZiZC03OTk0LTRiNzEtOWI4OC04NGZkY2UzNzVjOWMiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ._ToiwR-prRBy8IhEV46uTI-pNMZt07mFiJnIs01lwEZDpEfUqX3XfdkfQQlfrI_8uGAwflEhKsjt4n6igQBiQA";

  useEffect(() => {
    if (authLoading || !CURRENT_USER_ID) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/campaign`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setCampaigns(data);
      } catch {
        setError("Failed to load campaigns");
      } finally {
        setLoading(false);
      }
    })();
  }, [CURRENT_USER_ID, authLoading]);

  const handleDayClick = (date: Date) => {
    // setPrefillDate(date);
    // setCreateModalOpen(true);
  };

  return (
    <div className="h-screen bg-[#050505] text-white flex overflow-hidden w-full relative">
      <Sidebar />

      <main className="flex-1 overflow-auto p-4 sm:p-6 w-full">
        {/* Header Block with Flex Wraps */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">
              Campaigns
            </h1>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Manage your Gmail outreach campaigns
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end w-full sm:w-auto">
            {/* List / Calendar view toggler */}
            <div className="flex items-center bg-zinc-900 border border-white/10 rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
                  viewMode === "list"
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                List
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
                  viewMode === "calendar"
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <CalendarDays className="w-3 h-3" />
                Calendar
              </button>
            </div>

            <button
              onClick={() => router.push("/emailSenders")}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-all text-xs font-bold text-zinc-300"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">Email Senders</span>
            </button>
          </div>
        </div>

        {/* Loading status panel wrapper */}
        {loading && (
          <div className="flex items-center justify-center h-64 gap-2 text-zinc-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Loading campaigns…</span>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-64 gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">{error}</span>
          </div>
        )}

        {/* Empty dashboard notice framework */}
        {!loading && !error && campaigns.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-600">
            <Megaphone className="w-8 h-8 opacity-30" />
            <p className="text-xs">No campaigns yet</p>
          </div>
        )}

        {/* Dynamic responsive grid layout view container lists */}
        {!loading && !error && (
          <AnimatePresence mode="wait">
            {viewMode === "list" ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {campaigns.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {campaigns.map((campaign, i) => {
                      const pct =
                        campaign.total_recipients > 0
                          ? Math.round(
                              (campaign.sent_count /
                                campaign.total_recipients) *
                                100,
                            )
                          : 0;
                      return (
                        <motion.button
                          key={campaign.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() =>
                            router.push(`/campaign/${campaign.id}`)
                          }
                          className="text-left bg-[#0b0b0b] border border-[#1a1a1a] hover:border-white/10 rounded-2xl p-4 transition-all group w-full"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h2 className="text-xs font-semibold text-zinc-200 line-clamp-1 flex-1">
                              {campaign.name}
                            </h2>
                            <span
                              className={`shrink-0 ml-2 text-[9px] font-bold px-2 py-0.5 rounded-md border capitalize ${statusColors[campaign.status] || statusColors.pending}`}
                            >
                              {campaign.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-600 mb-3 font-mono truncate">
                            {campaign.meeting_link}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1.5">
                            <span>Progress</span>
                            <span className="font-mono">
                              {campaign.sent_count} /{" "}
                              {campaign.total_recipients}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
                            <motion.div
                              className="h-full bg-emerald-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-600">
                              {formatDate(campaign.created_at)}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="bg-[#0b0b0b] border border-[#1a1a1a] rounded-2xl p-4 sm:p-5"
                style={{ minHeight: "450px" }}
              >
                <CalendarView
                  campaigns={campaigns}
                  onDayClick={handleDayClick}
                  onCampaignClick={(id) => router.push(`/campaign/${id}`)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Creation campaign interactive context element popups */}
      <AnimatePresence>
        {createModalOpen && (
          <CreateCampaignModal
            onClose={() => {
              setCreateModalOpen(false);
              setPrefillDate(undefined);
            }}
            prefillDate={prefillDate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
