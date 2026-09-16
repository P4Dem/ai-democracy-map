"use client";

import { Mail, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Client-approved collection mechanism (Option 2): feedback goes to the P4D
// inbox via the visitor's own mail app (mailto) with a fixed subject line. No
// server, no PAT. This component only owns the presentation – a bottom-right
// pill that opens a small popover with an "Open email" action plus a
// copy-the-address fallback for visitors with no mail client configured.
const FEEDBACK_EMAIL = "hello@powerfordemocracies.org";
const FEEDBACK_SUBJECT = "Feedback from Website - AI Landscape Map";
const mailtoHref = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(FEEDBACK_SUBJECT)}`;

export const FloatingFeedback = () => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard?.writeText(FEEDBACK_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked – the Open email button still works */
    }
  };

  return (
    <div ref={rootRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div
          role="dialog"
          aria-label="Send feedback"
          className="w-64 rounded-xl border border-[#D6D6CA] bg-[#F4F4EA] p-3.5 text-[#1a1a17] shadow-[0_8px_24px_rgba(26,26,23,0.14)]"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold leading-snug">Send us feedback</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="-m-1 rounded p-1 text-[#5C5C52] transition-colors hover:text-[#1a1a17]"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#5C5C52]">
            Opens your email app, addressed to the P4D team. No mail client? Copy the address and write to us
            directly.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <a
              href={mailtoHref}
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-p4d-brick px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
            >
              <Mail className="size-3.5" /> Open email
            </a>
            <button
              type="button"
              onClick={copyAddress}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#D6D6CA] bg-white px-3 py-2 text-xs font-semibold text-[#1a1a17] transition-colors hover:bg-[#EAEADE]"
            >
              {copied ? "Address copied" : "Copy address"}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Send us feedback about this map"
        className="inline-flex items-center gap-2 rounded-full border border-[#D6D6CA] bg-[#1a1a17] px-4 py-2.5 text-sm font-semibold text-[#F4F4EA] shadow-[0_4px_14px_rgba(26,26,23,0.18)] transition-colors hover:bg-[#2c2c27]"
      >
        <Mail className="size-4" />
        <span className="hidden sm:inline">Feedback</span>
      </button>
    </div>
  );
};
