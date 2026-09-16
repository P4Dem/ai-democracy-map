"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Aspect } from "@/lib/types";
import { getPillarColor } from "@/lib/pillars";

let dialogOpener: ((aspect: Aspect) => void) | null = null;

export const openAspectDialog = (aspect: Aspect) => {
  dialogOpener?.(aspect);
};

export const AspectDialog = () => {
  const [aspect, setAspect] = useState<Aspect | null>(null);

  dialogOpener = setAspect;

  const c = aspect ? getPillarColor(aspect.code) : null;

  return (
    <Dialog open={aspect !== null} onOpenChange={(open) => !open && setAspect(null)}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        {aspect && c && (
          <>
            {/* Colored accent header */}
            <div style={{ backgroundColor: c.dialogHeaderBg }} className="px-6 pb-5 pt-6">
              <div
                className="mb-3 h-1 w-10 rounded-full"
                style={{ backgroundColor: c.dialogAccentBar }}
              />
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="rounded px-1.5 py-0.5 font-mono text-xs font-semibold"
                  style={{ backgroundColor: c.dialogBadgeBg, color: c.dialogBadgeText }}
                >
                  {aspect.code}
                </span>
                <span className="text-xs text-muted-foreground">{aspect.pillar}</span>
              </div>
              <DialogTitle className="text-xl leading-snug">{aspect.name}</DialogTitle>
            </div>

            {/* Body */}
            <div className="space-y-4 px-6 py-5">
              {aspect.definition && (
                <p className="text-sm italic text-muted-foreground leading-relaxed">
                  {aspect.definition}
                </p>
              )}
              {aspect.description && (
                <p className="text-sm leading-relaxed text-foreground/90">
                  {aspect.description}
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
