'use client';

import {
  AlertTriangle,
  Check,
  Cloud,
  CloudOff,
  Download,
  Mail,
  RefreshCw,
  Server,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api, type GenerateResult, type QueuedEmail, type ServerTemplate } from '@/services/api';
import { prepareSession, useBooth } from '@/services/store';
import { GlowButton, Panel, Spinner, cx } from './ui';

type Busy = 'generate' | 'email' | null;

/**
 * The booth backend: session, photo sync, server-side collage, print download
 * and the offline email queue. The strip on screen is still rendered locally —
 * this panel is what leaves the machine.
 */
export default function CloudPanel() {
  const { photos, sessionId, uploads, cloudError } = useBooth();

  const [online, setOnline] = useState<boolean | null>(null);
  const [templates, setTemplates] = useState<ServerTemplate[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [busy, setBusy] = useState<Busy>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [stamp, setStamp] = useState(0);
  const [email, setEmail] = useState('');
  const [queued, setQueued] = useState<QueuedEmail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const synced = photos.filter((p) => uploads[p.id] === 'done').length;
  const fits = templates.filter((t) => t.slots === photos.length);

  const probe = useCallback(async () => {
    try {
      await api.health();
      setTemplates(await api.templates());
      setOnline(true);
      setError(null);
    } catch (e) {
      setOnline(false);
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void probe();
  }, [probe]);

  // Photo count decides the template, so keep the choice valid as frames change.
  useEffect(() => {
    const options = templates.filter((t) => t.slots === photos.length);
    setTemplateId((current) =>
      options.some((t) => t.id === current) ? current : (options[0]?.id ?? ''),
    );
  }, [templates, photos.length]);

  /** Sync + render on the server. Always re-runs: the strip may have changed. */
  const buildOnServer = async () => {
    const id = await prepareSession();
    const res = await api.generate(id, templateId);
    setResult(res);
    setStamp(Date.now());
    setOnline(true);
    return id;
  };

  const run = async (kind: Exclude<Busy, null>) => {
    if (busy) return;
    setBusy(kind);
    setError(null);
    try {
      const id = await buildOnServer();
      if (kind === 'email') setQueued(await api.email(id, email));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const ready = online === true && templateId !== '' && photos.length > 0;

  return (
    <Panel className="!border-[#E5C2CC] !bg-white/80 backdrop-blur-xl shadow-xl">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4A1020]">
          Booth server
        </h3>
        <span
          className={cx(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-extrabold',
            online === false
              ? 'border-amber-400 bg-amber-50 text-amber-800'
              : 'border-[#D99BB0] bg-[#FFF0F4] text-[#6B1F34]',
          )}
        >
          {online === false ? <CloudOff size={12} /> : <Cloud size={12} />}
          {online === null ? 'Checking…' : online ? 'Connected' : 'Offline'}
        </span>
      </header>

      <p className="mb-3 text-[11px] font-semibold leading-relaxed text-[#7A243B]/70">
        Saves your frames to the booth and renders the print copy there — the emailed photo is
        that copy, not the on-screen styling.
      </p>

      <dl className="space-y-2 text-xs">
        <Row label="Session" value={sessionId ? `${sessionId.slice(0, 8)}…` : 'not started'} />
        <Row label="Photos synced" value={`${synced} / ${photos.length}`} />
        <Row label="Print template" value={templateId || '—'} />
      </dl>

      {fits.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {fits.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplateId(t.id)}
              className={cx(
                'rounded-full border px-3 py-1 text-[11px] font-bold transition-all',
                templateId === t.id
                  ? 'border-transparent bg-[#6B1F34] text-white'
                  : 'border-[#E5C2CC] bg-white text-[#6B1F34] hover:border-[#6B1F34]',
              )}
            >
              {t.id}
            </button>
          ))}
        </div>
      )}

      {online === true && photos.length > 0 && fits.length === 0 && (
        <p className="mt-3 text-[11.5px] font-semibold leading-relaxed text-amber-800">
          The server has no template for {photos.length}{' '}
          {photos.length === 1 ? 'photo' : 'photos'} — add one to app/templates/templates.json.
        </p>
      )}

      <div className="mt-4 space-y-2">
        <GlowButton
          accent="#6B1F34"
          className="w-full font-extrabold bg-[#6B1F34] text-[#FFFBF8] hover:bg-[#852741]"
          disabled={!ready || busy !== null}
          onClick={() => void run('generate')}
        >
          {busy === 'generate' ? <Spinner /> : <Server size={15} />}
          {busy === 'generate' ? 'Uploading & rendering…' : 'Save to booth server'}
        </GlowButton>

        {result && (
          <a
            href={`${api.downloadUrl(result.sessionId)}?t=${stamp}`}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#D99BB0] py-2.5 text-xs font-bold text-[#6B1F34] transition-all hover:bg-white"
          >
            <Download size={15} />
            Download server print
          </a>
        )}
      </div>

      {result && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${api.downloadUrl(result.sessionId)}?t=${stamp}`}
          alt="Server-rendered print"
          className="mt-3 w-full rounded-xl border border-[#E5C2CC]"
        />
      )}

      <form
        className="mt-4 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run('email');
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#7A243B]/70">
            Email me my photo
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="guest@example.com"
            className="w-full rounded-xl border border-[#E5C2CC] bg-white px-3 py-2.5 text-xs font-semibold text-[#4A1020] placeholder:text-[#7A243B]/35 focus:border-[#6B1F34] focus:outline-none"
          />
        </label>
        <GlowButton
          type="submit"
          variant="outline"
          className="w-full font-bold text-[#6B1F34] border-[#D99BB0]"
          disabled={!ready || busy !== null}
        >
          {busy === 'email' ? <Spinner /> : <Mail size={15} />}
          {busy === 'email' ? 'Queueing…' : 'Send it to me'}
        </GlowButton>
      </form>

      {queued && (
        <p className="mt-3 flex items-start gap-2 text-[11.5px] font-semibold leading-relaxed text-[#4A1020]">
          <Check size={14} className="mt-0.5 shrink-0 text-emerald-600" />
          Queued for {queued.email} (#{queued.queueId}). The booth sends it as soon as it is
          online.
        </p>
      )}

      {(error || cloudError) && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-[11.5px] font-semibold leading-relaxed text-amber-900">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span className="min-w-0 flex-1 break-words">{error ?? cloudError}</span>
          <button
            type="button"
            onClick={() => void probe()}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-amber-900 hover:bg-amber-100"
            aria-label="Retry"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      )}
    </Panel>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="font-semibold text-[#7A243B]/60">{label}</dt>
      <dd className="tabular-nums font-extrabold text-[#4A1020]">{value}</dd>
    </div>
  );
}
