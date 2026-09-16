"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
  group?: string;
};

type MultiSelectProps = {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

export const MultiSelect = ({
  label,
  options,
  selected,
  onChange,
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = ref.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inTrigger && !inDropdown) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        zIndex: 9999,
      });
    }
    setOpen(!open);
  };

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  const groups = options.reduce<Record<string, Option[]>>((acc, opt) => {
    const group = opt.group ?? "";
    (acc[group] ??= []).push(opt);
    return acc;
  }, {});

  const hasGroups = Object.keys(groups).some((g) => g !== "");

  const dropdown = open ? (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="animate-dropdown-in max-h-72 w-72 overflow-auto rounded-md border bg-popover p-1 shadow-md"
    >
      {selected.length > 0 && (
        <button
          type="button"
          className="mb-1 w-full rounded-sm px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
          onClick={() => onChange([])}
        >
          Clear all
        </button>
      )}
      {hasGroups
        ? Object.entries(groups).map(([group, opts]) => (
            <div key={group}>
              {group && (
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  {group}
                </div>
              )}
              {opts.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-sm leading-snug hover:bg-muted",
                    group && "pl-4"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(opt.value)}
                    onChange={() => toggle(opt.value)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border"
                  />
                  <span className="min-w-0 break-words">{opt.label}</span>
                </label>
              ))}
            </div>
          ))
        : options.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-sm leading-snug hover:bg-muted"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border"
              />
              <span className="min-w-0 break-words">{opt.label}</span>
            </label>
          ))}
    </div>
  ) : null;

  return (
    <div ref={ref} className="relative">
      <Button
        ref={triggerRef}
        variant="outline"
        size="sm"
        className="h-9 gap-1"
        onClick={openDropdown}
      >
        {label}
        {selected.length > 0 && (
          <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
            {selected.length}
          </Badge>
        )}
      </Button>
      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
};
