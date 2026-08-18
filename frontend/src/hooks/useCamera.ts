'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'ready' | 'denied' | 'error' | 'insecure';

export interface CameraApi {
  videoRef: React.RefObject<HTMLVideoElement>;
  status: CameraStatus;
  error: string | null;
  devices: MediaDeviceInfo[];
  /** deviceId of the track actually running, so the UI can highlight it. */
  activeDeviceId: string | null;
  selectDevice: (id: string) => void;
  start: () => void;
  stop: () => void;
}

const VIDEO_HINT = { width: { ideal: 1920 }, height: { ideal: 1080 } };

export function useCamera(active: boolean): CameraApi {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  /** Only set when the operator explicitly picks a camera — never auto-filled. */
  const [wantedDeviceId, setWantedDeviceId] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const start = useCallback(() => {
    setError(null);
    setNonce((n) => n + 1);
  }, []);

  const selectDevice = useCallback((id: string) => setWantedDeviceId(id), []);

  useEffect(() => {
    if (!active) {
      stop();
      setStatus('idle');
      return;
    }

    let cancelled = false;

    const attach = async (stream: MediaStream) => {
      stop();
      streamRef.current = stream;
      setActiveDeviceId(stream.getVideoTracks()[0]?.getSettings().deviceId ?? null);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setStatus('ready');

      // Labels only populate once permission has been granted.
      const list = await navigator.mediaDevices.enumerateDevices().catch(() => []);
      if (!cancelled) setDevices(list.filter((d) => d.kind === 'videoinput'));
    };

    (async () => {
      // getUserMedia is gated on a secure context — the usual cause of a booth
      // that "can't access the camera" when opened over http://<lan-ip>.
      if (typeof window !== 'undefined' && window.isSecureContext === false) {
        setStatus('insecure');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('error');
        setError('This browser does not expose a camera API. Try Chrome, Edge or Safari.');
        return;
      }

      setStatus('requesting');
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: wantedDeviceId
              ? { deviceId: { exact: wantedDeviceId }, ...VIDEO_HINT }
              : { facingMode: 'user', ...VIDEO_HINT },
            audio: false,
          });
        } catch (first) {
          // Exact device / resolution constraints fail on plenty of real hardware.
          const name = (first as DOMException)?.name;
          if (name === 'NotAllowedError' || name === 'SecurityError') throw first;
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        await attach(stream);
      } catch (e) {
        if (cancelled) return;
        const err = e as DOMException;
        if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
          setStatus('denied');
          setError(null);
        } else {
          setStatus('error');
          setError(
            err?.name === 'NotFoundError'
              ? 'No camera found on this device.'
              : err?.name === 'NotReadableError'
                ? 'The camera is already in use by another app. Close it and try again.'
                : err?.message || 'The camera could not be started.',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, wantedDeviceId, nonce]);

  useEffect(() => stop, [stop]);

  return { videoRef, status, error, devices, activeDeviceId, selectDevice, start, stop };
}
