const SKELETON_ROWS = 8;

// Keep in sync with COL_WIDTHS in DataTable.tsx
const COL_WIDTHS = {
  type:    "160px",
  aspects: "300px",
  source:  "140px",
} as const;

export const SkeletonRow = ({ index, noAnimation }: { index: number; noAnimation?: boolean }) => (
  <tr
    className={`border-b ${noAnimation ? "" : "animate-fade-in-up"}`}
    style={noAnimation ? undefined : { animationDelay: `${index * 50}ms` }}
  >
    <td className="p-3">
      <div className="h-6 w-16 animate-pulse rounded-md bg-muted" />
    </td>
    <td className="p-3">
      <div className="space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      </div>
    </td>
    <td className="p-3">
      <div className="flex items-start gap-2">
        <div className="mt-1 size-2 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </td>
    <td className="p-3">
      <div className="flex gap-1.5">
        <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
      </div>
    </td>
    <td className="p-3">
      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
    </td>
  </tr>
);

export const SkeletonTable = () => (
  <div className="animate-fade-in-up">
    <table className="min-w-[900px] w-full table-fixed text-sm">
      <colgroup>
        <col style={{ width: COL_WIDTHS.type }} />
        <col />
        <col />
        <col style={{ width: COL_WIDTHS.aspects }} />
        <col style={{ width: COL_WIDTHS.source }} />
      </colgroup>
      <thead>
        <tr className="border-b">
          <th className="p-2 text-left font-medium">Type</th>
          <th className="p-2 text-left font-medium">Description</th>
          <th className="p-2 text-left font-medium">Solution</th>
          <th className="p-2 text-left font-medium">Democracy Aspects</th>
          <th className="p-2 text-left font-medium">Source</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: SKELETON_ROWS }, (_, i) => (
          <SkeletonRow key={i} index={i} />
        ))}
      </tbody>
    </table>
  </div>
);
