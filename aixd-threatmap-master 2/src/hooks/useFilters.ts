import { useState, useCallback, useEffect } from "react";
import type { FilterState, ItemType } from "@/lib/types";

const DEFAULT_FILTERS: FilterState = {
  type: [],
  aspect: [],
  source: [],
  search: "",
};

const parseUrlFilters = (): Partial<FilterState> => {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const result: Partial<FilterState> = {};

  const type = params.get("type");
  if (type) result.type = type.split(",") as ItemType[];

  const aspect = params.get("aspect");
  if (aspect) result.aspect = aspect.split(",");

  const source = params.get("source");
  if (source) result.source = source.split(",");

  const q = params.get("q");
  if (q) result.search = q;

  return result;
};

const filtersToUrl = (filters: FilterState): string => {
  const params = new URLSearchParams();

  if (filters.type.length > 0) params.set("type", filters.type.join(","));
  if (filters.aspect.length > 0) params.set("aspect", filters.aspect.join(","));
  if (filters.source.length > 0) params.set("source", filters.source.join(","));
  if (filters.search) params.set("q", filters.search);

  const qs = params.toString();
  return qs ? `?${qs}` : window.location.pathname;
};

export const useFilters = () => {
  const [filters, setFiltersState] = useState<FilterState>(() => ({
    ...DEFAULT_FILTERS,
    ...parseUrlFilters(),
  }));

  const setFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFiltersState((prev) => {
        const next = { ...prev, [key]: value };
        const url = filtersToUrl(next);
        window.history.pushState(null, "", url);
        return next;
      });
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    window.history.pushState(null, "", window.location.pathname);
  }, []);

  const activeFilterCount =
    filters.type.length +
    filters.aspect.length +
    filters.source.length +
    (filters.search ? 1 : 0);

  useEffect(() => {
    const handlePopState = () => {
      setFiltersState({ ...DEFAULT_FILTERS, ...parseUrlFilters() });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return { filters, setFilter, resetFilters, activeFilterCount };
};
