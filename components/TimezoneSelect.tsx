"use client";

import { useState, useMemo, useRef, useEffect } from "react";

interface Props {
  value: string;
  onChange: (tz: string) => void;
}

// Get all timezones
const timezones = Intl.supportedValuesOf("timeZone");

// Format: (GMT+05:30) Asia/Kolkata
const formatTimezone = (tz: string) => {
  try {
    const now = new Date();

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });

    const parts = formatter.formatToParts(now);
    const offset = parts.find((p) => p.type === "timeZoneName")?.value || "";

    return `(${offset}) ${tz}`;
  } catch {
    return tz;
  }
};

export default function TimezoneSelect({ value, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered list
  const filtered = useMemo(() => {
    if (!search) return timezones;

    return timezones.filter((tz) =>
      tz.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search]);

  const handleSelect = (tz: string) => {
    onChange(tz);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <input
        type="text"
        value={isOpen ? search : formatTimezone(value)}
        placeholder="Search timezone..."
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50"
      />

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#0b0b0b] shadow-lg">
          {filtered.length > 0 ? (
            filtered.slice(0, 200).map((tz) => (
              <button
                key={tz}
                onClick={() => handleSelect(tz)}
                className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                {formatTimezone(tz)}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-zinc-500">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
