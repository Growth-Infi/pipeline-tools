"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Mail, Play, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function EmailVerifyTab() {
  const { csvData, setCsvData, columnOrder, setColumnOrder } = useAppStore();
  const [emailCol, setEmailCol] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState(""); // ✅ added

  const rawColumns =
    columnOrder.length > 0 ? columnOrder : Object.keys(csvData[0] || {});

  const columns = rawColumns.filter((col) => col.toLowerCase() !== "status");

  // 1. Auto-detect Email Column
  useEffect(() => {
    const keywords = ["email", "mail"];
    const detected = columns.find((col) =>
      keywords.some((k) => col.toLowerCase().includes(k)),
    );
    if (!emailCol && detected) {
      //  prevent override
      console.log("🔍 Auto-detected email column:", detected);
      setEmailCol(detected);
    }
  }, [columns]);

  // 2. Update CSV Logic
  const updateCsvWithResults = (results: any[]) => {
    console.log("📊 Updating CSV with results. Count:", results.length);

    if (!results || results.length === 0) {
      console.warn("⚠️ Empty results array received.");
      setIsLoading(false);
      setStatusMsg("⚠️ No results returned from server");
      return;
    }

    const newData = csvData.map((row) => {
      const rowEmail = String(row[emailCol] || "")
        .trim()
        .toLowerCase();

      const match = results.find(
        (r) => r.email && r.email.toLowerCase() === rowEmail,
      );

      return {
        ...row,
        status: match ? match.status : "Not Found",
      };
    });

    if (!columnOrder.includes("status")) {
      console.log("Adding 'status' to columnOrder");
      setColumnOrder([...columnOrder, "status"]);
    }

    setCsvData(newData);
    setIsLoading(false);
    setStatusMsg("✅ Verification Complete!");
    console.log("CSV Data state updated successfully.");
  };
  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending":
        return "Initializing...";
      case "processing":
        return "Running BrandNav verification...";
      case "brandav_completed":
        return "Sending to Reoon...";
      case "reoon_processing":
        return "Deep verification (Reoon)...";
      case "completed":
        return "Finalizing...";
      default:
        return "Processing...";
    }
  };
  // Polling Logic
  const pollJobStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/emailVerifier?jobId=${jobId}`, {
          credentials: "include",
        });
        const data = await res.json();
        setProgress({
          done: data.progress || 0,
          total: 100,
        });

        setStatusMsg(getStatusMessage(data.status));

        if (data.status === "completed") {
          updateCsvWithResults(data.results);
          return;
        }
        setTimeout(poll, 5000);
      } catch (err) {
        console.error(err);
        setTimeout(poll, 5000);
      }
    };
    poll();
  };

  // Submission Logic
  const handleVerifyEmails = async () => {
    if (!emailCol) {
      setErrorMsg(
        "⚠️ Please select an email column before running verification. Credits may be wasted.",
      );
      return;
    }

    if (!csvData.length) {
      setErrorMsg("⚠️ No data available.");
      return;
    }

    setErrorMsg("");

    setIsLoading(true);
    setStatusMsg("Initializing job...");
    setProgress({ done: 0, total: 100 });

    const emails = csvData
      .map((row) => String(row[emailCol] || "").trim())
      .filter(Boolean);

    console.log(" Submitting job with emails count:", emails.length);
    try {
      const res = await fetch("/api/emailVerifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
        credentials: "include",
      });

      const data = await res.json();
      if (data.jobId) {
        pollJobStatus(data.jobId);
      } else {
        throw new Error("No Job ID returned");
      }
    } catch (error) {
      setIsLoading(false);
      setStatusMsg("⚠️ Error starting job");
    }
  };

  return (
    <section className="space-y-2">
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
        Validation
      </h3>

      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-200">
              Email Verifier
            </div>
            <div className="text-[10px] text-zinc-500">
              Verify deliverability via API
            </div>
          </div>
        </div>

        <select
          value={emailCol}
          onChange={(e) => {
            setEmailCol(e.target.value);
            setErrorMsg("");
          }}
          disabled={isLoading}
          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Select email column...</option>
          {columns.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>

        {!emailCol && !isLoading && (
          <div className="text-[10px] text-amber-400 font-medium">
            ⚠️ No email column detected. Please select one to avoid wasting
            credits.
          </div>
        )}

        {errorMsg && (
          <div className="text-[10px] text-red-400 font-medium">{errorMsg}</div>
        )}

        {isLoading && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Loader2 className="w-2 h-2 animate-spin" /> {statusMsg}
              </span>
              <span>{progress.done}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{
                  width: `${progress.done}%`,
                }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleVerifyEmails}
          disabled={!emailCol || isLoading}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold text-[10px] uppercase rounded-lg transition-colors"
        >
          {isLoading ? (
            <Loader2 className="inline w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Play className="inline w-3 h-3 mr-1" />
          )}
          {isLoading ? "Verifying..." : "Run Verifier"}
        </button>

        {statusMsg && !isLoading && (
          <div className="flex items-center justify-center gap-1 text-[10px] font-medium text-emerald-500">
            {statusMsg.includes("✅") && <CheckCircle2 className="w-3 h-3" />}
            {statusMsg}
          </div>
        )}
      </div>
    </section>
  );
}
