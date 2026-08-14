'use client';

import { useEffect, useReducer, useRef } from 'react';
import type { Photo } from '@/utils/types';

/** Decoded-image cache keyed by src, so the canvas can draw synchronously on every frame. */
export function useImages(photos: Photo[]) {
  const cache = useRef(new Map<string, HTMLImageElement>());
  const [, bump] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    let live = true;
    photos.forEach((p) => {
      if (cache.current.has(p.src)) return;
      const img = new Image();
      img.onload = () => live && bump();
      cache.current.set(p.src, img);
      img.src = p.src;
    });
    return () => {
      live = false;
    };
  }, [photos]);

  // Web fonts land after first paint; redraw once they do or the strip title jumps.
  useEffect(() => {
    let live = true;
    document.fonts?.ready.then(() => live && bump());
    return () => {
      live = false;
    };
  }, []);

  return cache.current;
}
