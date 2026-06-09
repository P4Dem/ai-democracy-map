import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Item, AspectMap } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const escapeCsvField = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const exportToCsv = (items: Item[], aspects: AspectMap, filename = "threatmap-export.csv") => {
  const headers = ["Type", "Description", "Mitigation Strategy", "Aspects", "Source"];
  const rows = items.map((item) => [
    item.type,
    item.description,
    item.solution ?? "",
    item.aspects.map((code) => aspects[code]?.name ?? code).join("; "),
    item.sourceShort,
  ]);

  const csv = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
