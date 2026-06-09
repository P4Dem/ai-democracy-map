import { useState, useEffect } from "react";
import type { Item, AspectMap } from "@/lib/types";

const DATA_URL = import.meta.env.PUBLIC_DATA_URL ?? "/data/data.json";
const ASPECTS_URL = import.meta.env.PUBLIC_ASPECTS_URL ?? "/data/aspects.json";

type DataLoaderState = {
  items: Item[];
  aspects: AspectMap;
  isLoading: boolean;
  error: string | null;
};

export const useDataLoader = () => {
  const [state, setState] = useState<DataLoaderState>({
    items: [],
    aspects: {},
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const [dataRes, aspectsRes] = await Promise.all([
          fetch(DATA_URL, { signal: controller.signal }),
          fetch(ASPECTS_URL, { signal: controller.signal }),
        ]);

        if (!dataRes.ok) throw new Error(`Failed to load data: ${dataRes.status}`);
        if (!aspectsRes.ok) throw new Error(`Failed to load aspects: ${aspectsRes.status}`);

        const [items, aspects] = await Promise.all([
          dataRes.json() as Promise<Item[]>,
          aspectsRes.json() as Promise<AspectMap>,
        ]);

        setState({ items, aspects, isLoading: false, error: null });
      } catch (err) {
        if (controller.signal.aborted) return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load data",
        }));
      }
    };

    load();
    return () => controller.abort();
  }, []);

  return state;
};
