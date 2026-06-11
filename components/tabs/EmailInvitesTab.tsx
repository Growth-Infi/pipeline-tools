"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import {
  Megaphone,
  Play,
  X,
  Loader2,
  Calendar,
  Clock,
  Globe,
  UserCheck,
  AlignLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import TimezoneSelect from "../TimezoneSelect";
import { useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_MEET_INVITE_BACKEND_URL;
console.log("API_BASE ", API_BASE);

// Helper to format date for datetime-local input (YYYY-MM-DDTHH:mm)
const formatToDateTimeLocal = (date: Date) => {
  const pad = (num: number) => String(num).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
};

export default function EmailInvitesTab() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="space-y-2">
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
        Campaigns
      </h3>
      <button
        onClick={() => setModalOpen(true)}
        className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all text-left"
      >
        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
          <Megaphone className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium text-zinc-200">
            Create Campaign
          </div>
          <div className="text-[10px] text-zinc-500">
            Set up a new outreach campaign
          </div>
        </div>
      </button>

      <AnimatePresence>
        {modalOpen && (
          <CreateCampaignModal onClose={() => setModalOpen(false)} />
        )}
      </AnimatePresence>
    </section>
  );
}

function CreateCampaignModal({ onClose }: { onClose: () => void }) {
  const { csvData, columnOrder } = useAppStore();
  const { user, session } = useAuth();

  // const CURRENT_USER_ID = user?.id;
  // const token = session?.access_token;
  const CURRENT_USER_ID = user?.id || "ed3e59b8-2e6c-44ea-9f7b-1c8248fa3973";
  const token =
    session?.access_token ||
    "eyJhbGciOiJFUzI1NiIsImtpZCI6IjI0ZmJiMGY3LWFjZDItNDg2NS1hOGNiLTQ4ZTVmYzQ1ODkwNCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2RyZXBndm1xZmhwb3h5ZGVxcnVuLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlZDNlNTliOC0yZTZjLTQ0ZWEtOWY3Yi0xYzgyNDhmYTM5NzMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgxMTk4MzAyLCJpYXQiOjE3ODExOTQ3MDIsImVtYWlsIjoidmVkYW50ZGVzaG11a2gzMTA4QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jS3FGOWIzWTczYllMYkg4STBQa3FuMUM3cVlXak1OUGhYeHZVNDhsSlNkbnVkOEZBPXM5Ni1jIiwiZW1haWwiOiJ2ZWRhbnRkZXNobXVraDMxMDhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IlZlZGFudCBEZXNobXVraCIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJWZWRhbnQgRGVzaG11a2giLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLcUY5YjNZNzNiWUxiSDhJMFBrcW4xQzdxWVdqTU5QaFh4dlU0OGxKU2RudWQ4RkE9czk2LWMiLCJwcm92aWRlcl9pZCI6IjExNTAwNTI5NTczNzU3NjU2NjA1MyIsInN1YiI6IjExNTAwNTI5NTczNzU3NjU2NjA1MyJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzgwNDc5NDQzfV0sInNlc3Npb25faWQiOiI5NThiN2VhOS1mNjhlLTRhMDUtYjk1Yi1kMTRiYWQ0YjA2YzQiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.cR8hYIwkRYMz2MATBTZ18eEBu2U4kpEFVDRRSGOPuJfmc9dp_NKSM-5JYme8uYKMxchSVsyg3P7bPBxR3zsVCg";

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [emailCol, setEmailCol] = useState("");

  // Time & Zone State
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [startTime, setStartTime] = useState(formatToDateTimeLocal(new Date()));
  const [endTime, setEndTime] = useState("");

  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  // Sender State
  const [senders, setSenders] = useState<any[]>([]);
  const [selectedSenderIds, setSelectedSenderIds] = useState<string[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [fetchingSenders, setFetchingSenders] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const columns = (
    columnOrder.length > 0 ? columnOrder : Object.keys(csvData[0] || {})
  ).filter((col) => col.toLowerCase() !== "status");

  // Auto-detect email column
  useEffect(() => {
    const keywords = ["email", "mail"];
    const detected = columns.find((col) =>
      keywords.some((k) => col.toLowerCase().includes(k)),
    );
    if (!emailCol && detected) setEmailCol(detected);
  }, [columns]);

  // Fetch active senders on mount
  useEffect(() => {
    const fetchSenders = async () => {
      try {
        const res = await fetch(`${API_BASE}/gmail/accounts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setSenders(data.filter((s: any) => s.status === "active"));
      } catch (err) {
        console.error("Failed to load senders");
      } finally {
        setFetchingSenders(false);
      }
    };
    fetchSenders();
  }, [user]);

  // Auto-set end time to 30 mins after start time
  useEffect(() => {
    if (startTime) {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + 30 * 60000);
      setEndTime(formatToDateTimeLocal(end));
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
      start_time: startTime + ":00", // Format to YYYY-MM-DDTHH:mm:ss
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
    } catch (err) {
      setError("Failed to create campaign. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-lg bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Launch Campaign
              </h2>
              <p className="text-[10px] text-zinc-500 font-medium">
                Configure meeting and outreach details
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
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {success ? (
            <div className="flex items-center justify-center py-12 text-emerald-400 text-sm font-medium">
              Campaign created successfully!
            </div>
          ) : (
            <>
              {/* Campaign Basic Info */}
              <div className="grid grid-cols-2 gap-4">
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
                  style={{
                    resize: "none",
                    overflow: "hidden",
                    maxHeight: "200px",
                  }}
                  // Change overflow to "auto" when content exceeds maxHeight
                  onChange={(e) => {
                    setDescription(e.target.value);
                    e.target.style.height = "auto";
                    const newHeight = e.target.scrollHeight;
                    e.target.style.height = `${Math.min(newHeight, 200)}px`;
                    e.target.style.overflowY =
                      newHeight > 200 ? "auto" : "hidden";
                  }}
                  placeholder="Supports **bold**, *italic*, ### headings, - lists..."
                  rows={2}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>

              {/* Meet & Email Config */}
              <div className="grid grid-cols-2 gap-4">
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
                    Target Email Column
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

              {/* Scheduling Section */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {/* Calendar */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date Range
                    </label>
                    <div className="bg-black border border-white/10 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(startTime || Date.now());
                            d.setMonth(d.getMonth() - 1);
                            setViewMonth(d.getMonth());
                            setViewYear(d.getFullYear());
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 text-sm"
                        >
                          ‹
                        </button>
                        <span className="text-[11px] font-medium text-zinc-300">
                          {
                            [
                              "Jan",
                              "Feb",
                              "Mar",
                              "Apr",
                              "May",
                              "Jun",
                              "Jul",
                              "Aug",
                              "Sep",
                              "Oct",
                              "Nov",
                              "Dec",
                            ][viewMonth]
                          }{" "}
                          {viewYear}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (viewMonth === 11) {
                              setViewMonth(0);
                              setViewYear((y) => y + 1);
                            } else setViewMonth((m) => m + 1);
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 text-sm"
                        >
                          ›
                        </button>
                      </div>

                      <div className="grid grid-cols-7 mb-1">
                        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                          <div
                            key={i}
                            className="text-center text-[9px] text-zinc-600 font-medium py-0.5"
                          >
                            {d}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-y-0.5">
                        {(() => {
                          const pad = (n: number) => String(n).padStart(2, "0");
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const firstDay = new Date(
                            viewYear,
                            viewMonth,
                            1,
                          ).getDay();
                          const daysInMonth = new Date(
                            viewYear,
                            viewMonth + 1,
                            0,
                          ).getDate();
                          const cells = [];

                          // current time portion from startTime/endTime
                          const startTimePart =
                            startTime?.slice(11, 16) || "09:00";
                          const endTimePart = endTime?.slice(11, 16) || "09:30";
                          const startDatePart = startTime?.slice(0, 10) || "";
                          const endDatePart = endTime?.slice(0, 10) || "";

                          for (let i = 0; i < firstDay; i++)
                            cells.push(<div key={`e-${i}`} />);

                          for (let d = 1; d <= daysInMonth; d++) {
                            const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
                            const date = new Date(viewYear, viewMonth, d);
                            const isPast = date < today;
                            const isStart = dateStr === startDatePart;
                            const isEnd = dateStr === endDatePart;
                            const inRange =
                              startDatePart &&
                              endDatePart &&
                              dateStr > startDatePart &&
                              dateStr < endDatePart;

                            cells.push(
                              <button
                                key={d}
                                type="button"
                                disabled={isPast}
                                onClick={() => {
                                  if (!startTime || endTime) {
                                    // picking start
                                    setStartTime(`${dateStr}T${startTimePart}`);
                                    setEndTime("");
                                  } else {
                                    // picking end
                                    const newEnd =
                                      dateStr < startDatePart
                                        ? startDatePart
                                        : dateStr;
                                    const newStart =
                                      dateStr < startDatePart
                                        ? dateStr
                                        : startDatePart;
                                    setStartTime(
                                      `${newStart}T${startTimePart}`,
                                    );
                                    setEndTime(`${newEnd}T${endTimePart}`);
                                  }
                                }}
                                className={`text-center text-[11px] py-1 rounded-md transition-all
                    ${isPast ? "text-zinc-700 cursor-not-allowed" : ""}
                    ${isStart || isEnd ? "bg-rose-500 text-white font-medium" : ""}
                    ${inRange ? "bg-rose-500/15 text-rose-300" : ""}
                    ${!isStart && !isEnd && !inRange && !isPast ? "text-zinc-400 hover:bg-white/10 hover:text-white" : ""}
                  `}
                              >
                                {d}
                              </button>,
                            );
                          }
                          return cells;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Time & Duration */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Start Time
                      </label>
                      <input
                        type="time"
                        value={startTime?.slice(11, 16) || ""}
                        onChange={(e) => {
                          const datePart =
                            startTime?.slice(0, 10) ||
                            formatToDateTimeLocal(new Date()).slice(0, 10);
                          setStartTime(`${datePart}T${e.target.value}`);
                          // auto update end time +30
                          const [h, m] = e.target.value.split(":").map(Number);
                          const total = h * 60 + m + 30;
                          const newTime = `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
                          const endDatePart = endTime?.slice(0, 10) || datePart;
                          setEndTime(`${endDatePart}T${newTime}`);
                        }}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3" /> End Time
                      </label>
                      <input
                        type="time"
                        value={endTime?.slice(11, 16) || ""}
                        onChange={(e) => {
                          const datePart =
                            endTime?.slice(0, 10) ||
                            startTime?.slice(0, 10) ||
                            formatToDateTimeLocal(new Date()).slice(0, 10);
                          setEndTime(`${datePart}T${e.target.value}`);
                        }}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50 font-mono"
                      />
                    </div>

                    {/* Quick duration */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">
                        Duration
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        {[15, 30, 45, 60].map((mins) => {
                          const startT = startTime?.slice(11, 16);
                          const [h, m] = (startT || "09:00")
                            .split(":")
                            .map(Number);
                          const total = h * 60 + m + mins;
                          const projected = `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
                          const isActive = endTime?.slice(11, 16) === projected;
                          return (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => {
                                const datePart =
                                  endTime?.slice(0, 10) ||
                                  startTime?.slice(0, 10) ||
                                  formatToDateTimeLocal(new Date()).slice(
                                    0,
                                    10,
                                  );
                                setEndTime(`${datePart}T${projected}`);
                              }}
                              className={`py-1.5 rounded-lg text-[10px] font-medium border transition-all
                  ${isActive ? "bg-rose-500/20 border-rose-500/40 text-rose-300" : "bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"}`}
                            >
                              {mins}m
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Summary */}
                    {startTime && (
                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-white/5 space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-500">Start</span>
                          <span className="text-zinc-300 font-mono">
                            {startTime.replace("T", " ")}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-500">End</span>
                          <span className="text-zinc-300 font-mono">
                            {endTime ? endTime.replace("T", " ") : "—"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timezone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Timezone
                  </label>
                  <TimezoneSelect value={timezone} onChange={setTimezone} />
                </div>
              </div>

              {/* Sender Multi-select */}
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
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-all group
        ${
          isSelected
            ? "bg-rose-500/10 border-rose-500/40 shadow-sm"
            : "bg-zinc-900/40 border-white/5 hover:border-white/20 hover:bg-white/5"
        }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {/* Avatar circle */}
                            <div
                              className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold
            ${
              isSelected
                ? "bg-rose-500/20 text-rose-300"
                : "bg-zinc-800 text-zinc-400"
            }`}
                            >
                              {s.email?.[0]?.toUpperCase()}
                            </div>

                            {/* Email */}
                            <span
                              className={`text-[11px] truncate transition-colors
            ${
              isSelected
                ? "text-rose-200"
                : "text-zinc-400 group-hover:text-zinc-200"
            }`}
                            >
                              {s.email}
                            </span>
                          </div>

                          {/* Custom checkbox */}
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                setSelectedSenderIds(
                                  e.target.checked
                                    ? [...selectedSenderIds, s.id]
                                    : selectedSenderIds.filter(
                                        (id) => id !== s.id,
                                      ),
                                );
                              }}
                              className="absolute opacity-0 w-0 h-0"
                            />

                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-all
            ${
              isSelected
                ? "bg-rose-500 border-rose-500"
                : "border-white/20 bg-transparent group-hover:border-white/40"
            }`}
                            >
                              {isSelected && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
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

        {/* Footer */}
        {!success && (
          <div className="p-5 border-t border-white/5 bg-[#0a0a0a] flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all flex items-center gap-2"
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
