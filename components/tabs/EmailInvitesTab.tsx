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
  const { user } = useAuth();

  const CURRENT_USER_ID = user?.id || "ed3e59b8-2e6c-44ea-9f7b-1c8248fa3973";

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
        const res = await fetch(
          `${API_BASE}/gmail/accounts?user_id=${CURRENT_USER_ID}`,
        );
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
        headers: { "Content-Type": "application/json" },
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
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context for the invite..."
                  rows={2}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50 resize-none"
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
                    senders.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSenderIds.includes(s.id)}
                          onChange={(e) => {
                            setSelectedSenderIds(
                              e.target.checked
                                ? [...selectedSenderIds, s.id]
                                : selectedSenderIds.filter((id) => id !== s.id),
                            );
                          }}
                          className="w-3 h-3 rounded bg-zinc-800 border-white/10 text-rose-500 focus:ring-0"
                        />
                        <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 transition-colors">
                          {s.email}
                        </span>
                      </label>
                    ))
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
