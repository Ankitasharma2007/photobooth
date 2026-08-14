'use client';

import { useCallback, useRef } from 'react';

/**
 * Synthesised shutter + countdown beeps — no audio assets to ship or preload,
 * and it works offline on a kiosk.
 */
export function useShutter() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ctx = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctxRef.current) ctxRef.current = new AC();
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const beep = useCallback(
    (freq = 880, duration = 0.09, gain = 0.06) => {
      const ac = ctx();
      if (!ac) return;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
      osc.connect(g).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + duration + 0.02);
    },
    [ctx],
  );

  const shutter = useCallback(() => {
    const ac = ctx();
    if (!ac) return;
    const now = ac.currentTime;

    // Mirror slap: short filtered noise burst.
    const len = Math.floor(ac.sampleRate * 0.12);
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400;
    bp.Q.value = 0.9;
    const ng = ac.createGain();
    ng.gain.value = 0.5;
    noise.connect(bp).connect(ng).connect(ac.destination);
    noise.start(now);

    // Curtain close: descending click.
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1600, now + 0.045);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.13);
    g.gain.setValueAtTime(0.0001, now + 0.045);
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.055);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    osc.connect(g).connect(ac.destination);
    osc.start(now + 0.045);
    osc.stop(now + 0.18);
  }, [ctx]);

  return { shutter, beep, prime: ctx };
}
