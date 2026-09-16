"use client";

import { useCallback, useRef, useState } from "react";

// Shared pan/zoom for map panels, ported from the client mock's useSvgPanZoom:
// wheel zoom, drag-pan with a 4px movement threshold, and the drag-vs-click
// fix – a synthetic click fired after a real drag is swallowed so it never
// triggers a spurious box/link selection.
export function useSvgPanZoom(minScale = 0.5, maxScale = 4) {
  const [panZoom, setPanZoom] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const movedRef = useRef(false);
  const justDraggedRef = useRef(false);

  const onWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      setPanZoom((v) => ({ ...v, scale: Math.min(maxScale, Math.max(minScale, v.scale * (1 + delta))) }));
    },
    [minScale, maxScale]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;
      dragRef.current = { x: e.clientX, y: e.clientY, ox: panZoom.x, oy: panZoom.y };
      movedRef.current = false;
    },
    [panZoom.x, panZoom.y]
  );

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    if (!movedRef.current && Math.hypot(dx, dy) < 4) return;
    movedRef.current = true;
    setIsDragging(true);
    setPanZoom((v) => ({ ...v, x: dragRef.current!.ox + dx, y: dragRef.current!.oy + dy }));
  }, []);

  const onMouseUp = useCallback(() => {
    if (!dragRef.current) return;
    justDraggedRef.current = movedRef.current;
    dragRef.current = null;
    movedRef.current = false;
    setIsDragging(false);
    if (justDraggedRef.current) setTimeout(() => (justDraggedRef.current = false), 0);
  }, []);

  const wasJustDragged = useCallback(() => justDraggedRef.current, []);
  const zoomBy = useCallback(
    (factor: number) => setPanZoom((v) => ({ ...v, scale: Math.min(maxScale, Math.max(minScale, v.scale * factor)) })),
    [minScale, maxScale]
  );
  const reset = useCallback(() => setPanZoom({ x: 0, y: 0, scale: 1 }), []);

  return { panZoom, isDragging, onWheel, onMouseDown, onMouseMove, onMouseUp, wasJustDragged, zoomBy, reset };
}