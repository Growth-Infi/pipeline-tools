"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Globe, Play } from "lucide-react";
import { motion } from "framer-motion";

export default function DomainFindTab() {
  const { csvData, setCsvData, columnOrder } = useAppStore();
  const [successMsg, setSuccessMsg] = useState("");
  // NEW: track early stop
  const [stoppedEarly, setStoppedEarly] = useState(false);

  const rawColumns =
    columnOrder.length > 0 ? columnOrder : Object.keys(csvData[0] || {});

  const columns = rawColumns.filter((col) => col.toLowerCase() !== "domain");

  const [companyCol, setCompanyCol] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const detectCompanyColumn = (cols: string[]) => {
    const keywords = ["company", "organization", "org"];
    return (
      cols.find((col) => keywords.some((k) => col.toLowerCase().includes(k))) ||
      ""
    );
  };

  useEffect(() => {
    if (!companyCol && columns.length) {
      const detected = detectCompanyColumn(columns);
      if (detected) {
        setCompanyCol(detected);
      }
    }
  }, [columns]);

  const handleFindDomains = async () => {
    if (!companyCol || !csvData.length) return;

    if (companyCol.toLowerCase() === "domain") {
      return;
    }

    setIsLoading(true);
    setStoppedEarly(false); // reset
    setProgress({ done: 0, total: csvData.length });

    const newData = JSON.parse(JSON.stringify(csvData));

    const BATCH_SIZE = 25;
    const CONCURRENCY = 3;

    let stopped = false;

    const processBatch = async (startIdx: number) => {
      const batch: string[] = [];
      const indices: number[] = [];

      for (
        let i = startIdx;
        i < Math.min(startIdx + BATCH_SIZE, newData.length);
        i++
      ) {
        const company = String(newData[i][companyCol] || "").trim();

        if (company) {
          batch.push(company);
          indices.push(i);
        } else {
          newData[i] = { ...newData[i], domain: "" };
          setProgress((p) => ({ ...p, done: p.done + 1 }));
        }
      }

      if (batch.length === 0) return;

      try {
        const res = await fetch("/api/serper", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companies: batch }),
        });

        const data = await res.json();

        //  NEW: detect backend stop
        if (data.stoppedEarly) {
          stopped = true;
          setStoppedEarly(true);
        }

        const domains = data.domains || [];

        indices.forEach((rowIdx, i) => {
          newData[rowIdx] = {
            ...newData[rowIdx],
            domain: domains[i] || "Not Found",
          };
        });
      } catch (err) {
        console.error(" API error:", err);

        indices.forEach((rowIdx) => {
          newData[rowIdx] = {
            ...newData[rowIdx],
            domain: "Error",
          };
        });
      }

      setProgress((p) => ({ ...p, done: p.done + indices.length }));

      setCsvData(JSON.parse(JSON.stringify(newData)));
    };

    const batchStarts = [];
    for (let i = 0; i < newData.length; i += BATCH_SIZE) {
      batchStarts.push(i);
    }

    for (let i = 0; i < batchStarts.length; i += CONCURRENCY) {
      //  NEW: stop further batches
      if (stopped) {
        console.warn("Stopped early from backend");
        break;
      }

      const chunk = batchStarts
        .slice(i, i + CONCURRENCY)
        .map((start) => processBatch(start));

      await Promise.all(chunk);
      await new Promise((r) => setTimeout(r, 200));
    }

    setIsLoading(false);

    //  NEW: dynamic message
    if (stopped) {
      setSuccessMsg("⚠️ Stopped early due to too many failures");
    } else {
      setSuccessMsg(`Domains added successfully to ${csvData.length} rows!`);
    }
  };

  return (
    <section className="space-y-2">
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
        Enrichment
      </h3>

      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-200">
              Find Domains
            </div>
            <div className="text-[10px] text-zinc-500">
              Extract company domains automatically
            </div>
          </div>
        </div>

        <select
          value={companyCol}
          onChange={(e) => setCompanyCol(e.target.value)}
          disabled={isLoading}
          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
        >
          <option value="">Select company column...</option>
          {columns.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>

        {isLoading && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span>Processing...</span>
              <span>
                {progress.done} / {progress.total}
              </span>
            </div>

            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-500"
                animate={{
                  width: `${(progress.done / progress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleFindDomains}
          disabled={!companyCol || isLoading}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold text-[10px] uppercase rounded-lg"
        >
          <Play className="inline w-3 h-3 mr-1" />
          {isLoading ? "Finding..." : "Run Domain Finder"}
        </button>

        {successMsg && (
          <div
            className={`text-[10px] font-medium text-center ${
              stoppedEarly ? "text-yellow-500" : "text-green-500"
            }`}
          >
            {successMsg}
          </div>
        )}
      </div>
    </section>
  );
}
