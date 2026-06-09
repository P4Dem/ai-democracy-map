import { Badge } from "@/components/ui/badge";
import type { ItemType } from "@/lib/types";

type TypeBadgeProps = {
  type: ItemType;
};

type TypeConfig = {
  label: string;
  className: string;
  // Two-line badge: overrides h-5/whitespace-nowrap with a compact stacked layout
  twoLine?: boolean;
};

const TYPE_CONFIG: Record<string, TypeConfig> = {
  "threat-solution": {
    label: "Threat +\nMitigation",
    className: "bg-p4d-brick/10 text-p4d-brick border-p4d-brick/20",
    twoLine: true,
  },
  threat: {
    label: "Threat",
    className: "bg-p4d-brick/10 text-p4d-brick border-p4d-brick/20",
  },
  "independent-opportunity": {
    label: "Opportunity",
    className: "bg-p4d-grassroot/10 text-p4d-grassroot border-p4d-grassroot/20",
  },
};

export const TypeBadge = ({ type }: TypeBadgeProps) => {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG["threat"];
  return (
    <Badge
      variant="outline"
      className={`justify-center text-center ${
        config.twoLine
          ? "h-auto min-w-[5rem] whitespace-pre-line py-1 text-[12px] leading-tight"
          : "min-w-[5.5rem]"
      } ${config.className}`}
    >
      {config.label}
    </Badge>
  );
};
