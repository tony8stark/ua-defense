// Responsive canvas scaling hook
import { useState, useEffect, useCallback } from 'react';

export function useCanvasScale(logicalW, logicalH, containerRef) {
  const [scale, setScale] = useState(1);

  const recalc = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Leave room for UI above/below canvas
    const maxW = rect.width;
    const maxH = rect.height;
    const s = Math.min(maxW / logicalW, maxH / logicalH, 1);
    setScale(s);
  }, [logicalW, logicalH, containerRef]);

  useEffect(() => {
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [recalc]);

  return scale;
}

// Convert screen coords to canvas logical coords
export function screenToCanvas(e, canvasEl, logicalW, logicalH) {
  const r = canvasEl.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (logicalW / r.width),
    y: (e.clientY - r.top) * (logicalH / r.height),
  };
}
