import { useState, useEffect } from "react";
import type { Item, AspectMap, HarmTaxonomy, BenefitTaxonomy } from "@/lib/types";

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, "/");
const DATA_URL = import.meta.env.PUBLIC_DATA_URL ?? `${BASE}data/data.json`;
const ASPECTS_URL = import.meta.env.PUBLIC_ASPECTS_URL ?? `${BASE}data/aspects.json`;
const HARM_TAX_URL = import.meta.env.PUBLIC_HARM_TAXONOMY_URL ?? `${BASE}data/harm_taxonomy.json`;
const BENEFIT_TAX_URL = import.meta.env.PUBLIC_BENEFIT_TAXONOMY_URL ?? `${BASE}data/benefit_taxonomy.json`;

type DataLoaderState = {
  items: Item[];
  aspects: AspectMap;
  harmTaxonomy: HarmTaxonomy;
  benefitTaxonomy: BenefitTaxonomy;
  isLoading: boolean;
  error: string | null;
};

export const useDataLoader = () => {
  const [state, setState] = useState<DataLoaderState>({
    items: [],
    aspects: {},
    harmTaxonomy: { tiers: {}, codes: {} },
    benefitTaxonomy: { groups: {}, codes: {} },
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const [dataRes, aspectsRes, harmRes, benefitRes] = await Promise.all([
          fetch(DATA_URL, { signal: controller.signal }),
          fetch(ASPECTS_URL, { signal: controller.signal }),
          fetch(HARM_TAX_URL, { signal: controller.signal }),
          fetch(BENEFIT_TAX_URL, { signal: controller.signal }),
        ]);

        if (!dataRes.ok) throw new Error(`Failed to load data: ${dataRes.status}`);
        if (!aspectsRes.ok) throw new Error(`Failed to load aspects: ${aspectsRes.status}`);
        if (!harmRes.ok) throw new Error(`Failed to load harm taxonomy: ${harmRes.status}`);
        if (!benefitRes.ok) throw new Error(`Failed to load benefit taxonomy: ${benefitRes.status}`);

        const [items, aspects, harmTaxonomy, benefitTaxonomy] = await Promise.all([
          dataRes.json() as Promise<Item[]>,
          aspectsRes.json() as Promise<AspectMap>,
          harmRes.json() as Promise<HarmTaxonomy>,
          benefitRes.json() as Promise<BenefitTaxonomy>,
        ]);

        setState({ items, aspects, harmTaxonomy, benefitTaxonomy, isLoading: false, error: null });
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
