import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Page } from '@/components/layout/AppShell';
import { QuestionFeed } from '@/components/question/QuestionFeed';
import { Button } from '@/components/common/Button';
import { useBank } from '@/state/BankStore';
import { useUser } from '@/state/UserStore';
import type { PracticeMode } from '@/types/question';

/**
 * The root experience. Opening the app lands here with a question already on
 * screen — no dashboard, no start screen.
 *
 * Scope lives in the URL (`?mode=`, `?subject=`, `?topic=`, `?year=`, `?id=`)
 * so a session is linkable and survives a refresh or a shared link.
 */

interface ModeOption {
  mode: PracticeMode;
  label: string;
  description: string;
}

const MODES: ModeOption[] = [
  { mode: 'random', label: 'Mixed', description: 'Random across the bank' },
  { mode: 'unattempted', label: 'Unattempted', description: 'Only questions you have not seen' },
  { mode: 'wrong', label: 'Wrong answers', description: 'Reattempt the ones you missed' },
  { mode: 'revision', label: 'Revision', description: 'Questions you marked' },
  { mode: 'difficult', label: 'Difficult', description: 'Medium and hard only' },
];

export function PracticePage() {
  const [params, setParams] = useSearchParams();
  const { manifest, status } = useBank();
  const { index, settings } = useUser();
  const [showModes, setShowModes] = useState(false);

  const mode = (params.get('mode') as PracticeMode) ?? settings.defaultMode;
  const subject = params.get('subject') ?? undefined;
  const topic = params.get('topic') ?? undefined;
  const yearParam = params.get('year');
  const year = yearParam ? Number(yearParam) : undefined;
  const pin = params.get('id') ?? null;

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const activeMode = MODES.find((m) => m.mode === mode)?.label ?? 'Mixed';
  const poolLabel = subject ?? topic ?? (year ? String(year) : null);

  const counts: Record<string, number | undefined> = {
    unattempted: manifest ? manifest.total - index.attempted.size : undefined,
    wrong: index.wrong.size,
    revision: index.marked.size,
  };

  if (status === 'error') {
    return (
      <Page>
        <div className="rounded-xl border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad-ink">
          The question bank could not be loaded. Check your connection and refresh the page.
        </div>
      </Page>
    );
  }

  return (
    <Page className="flex min-h-[calc(100dvh-3.5rem)] flex-col pb-2 lg:min-h-dvh">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowModes((v) => !v)}
          aria-expanded={showModes}
          className="inline-flex h-8 items-center gap-1.5 rounded-[9px] border border-hair bg-card px-2.5 text-[13px] font-medium text-fg transition-colors hover:bg-raised"
        >
          {activeMode}
          {poolLabel && <span className="text-fg2">· {poolLabel}</span>}
          <span aria-hidden className="text-fg3">
            ▾
          </span>
        </button>

        {pin && (
          <Button size="sm" variant="ghost" onClick={() => setParam('id', null)} className="ml-auto">
            Back to session
          </Button>
        )}
      </div>

      {showModes && (
        <div className="animate-rise mb-4 rounded-xl border border-hair bg-card p-1.5">
          {MODES.map((m) => (
            <button
              key={m.mode}
              type="button"
              onClick={() => {
                setParam('mode', m.mode);
                setParam('id', null);
                setShowModes(false);
              }}
              className={`flex w-full items-center gap-3 rounded-[9px] px-2.5 py-2 text-left transition-colors duration-150 ${
                m.mode === mode ? 'bg-brand-soft' : 'hover:bg-raised'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-fg">{m.label}</span>
                <span className="block text-2xs text-fg2">{m.description}</span>
              </span>
              {counts[m.mode] !== undefined && (
                <span className="tnum shrink-0 text-xs text-fg2">{counts[m.mode]}</span>
              )}
            </button>
          ))}
        </div>
      )}

      <QuestionFeed
        scope={{ mode, subject, topic, year, pin }}
        poolLabel={poolLabel ?? undefined}
      />
    </Page>
  );
}
