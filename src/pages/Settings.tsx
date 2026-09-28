import { useRef, useState } from 'react';
import { Check, Download, Info, Monitor, Moon, Sun, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { PracticeMode } from '@/types/question';
import { useUser } from '@/state/UserProvider';
import { useBank } from '@/state/BankProvider';
import { countRecords, downloadUserData, readFile } from '@/services/transferService';
import { storageUsage, reviveUserData } from '@/services/storageService';
import { Button } from '@/components/common/Button';
import { Switch } from '@/components/common/Switch';
import { Modal } from '@/components/common/Modal';
import { Select } from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { useToast } from '@/components/common/Toast';
import { ErrorState } from '@/components/common/ErrorState';

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-line px-4 py-3.5 sm:px-5">
        <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-2xs leading-relaxed text-ink-mute">{description}</p>}
      </div>
      <div className="px-4 py-1 sm:px-5">{children}</div>
    </section>
  );
}

const MODE_OPTIONS: { value: PracticeMode; label: string }[] = [
  { value: 'random', label: 'Random from the whole bank' },
  { value: 'unattempted', label: 'Never attempted yet' },
  { value: 'wrong', label: 'Previously answered wrongly' },
  { value: 'revision', label: 'Marked for revision' },
  { value: 'difficult', label: 'Medium and hard only' },
];

export function Settings() {
  const { user, settings, setSettings, setTheme, reset, importUserData } = useUser();
  const { total, issues } = useBank();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState<null | 'progress' | 'notes' | 'revision' | 'wrong' | 'all'>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const records = countRecords(user);
  const usage = storageUsage();

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  const onImport = async (file: File) => {
    const result = await readFile(file);
    if (!result.ok || !result.data) {
      setImportError(result.message);
      return;
    }
    const cleaned = reviveUserData(result.data);
    importUserData(cleaned);
    setImportError(null);
    toast('Progress imported', 'success');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-4">
      {/* Appearance */}
      <Section title="Appearance" description="Applies immediately and is remembered on this device.">
        <div className="py-4">
          <div
            role="radiogroup"
            aria-label="Theme"
            className="grid grid-cols-3 gap-2"
          >
            {themes.map((t) => {
              const active = settings.theme === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border px-3 py-3.5 text-[13px] font-medium transition-colors duration-150',
                    active
                      ? 'border-brand/45 bg-brand-soft text-brand-ink'
                      : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink',
                  )}
                >
                  <t.icon aria-hidden className="size-[18px]" />
                  {t.label}
                  {active && <Check aria-hidden className="size-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
        <Switch
          checked={settings.reduceMotion}
          onChange={(v) => setSettings({ reduceMotion: v })}
          label="Reduce motion"
          description="Turns off question transitions and the chart animations."
        />
      </Section>

      {/* Practice */}
      <Section title="Question preferences" description="How questions are picked and what is shown after you submit.">
        <div className="space-y-1 border-b border-line py-3">
          <label htmlFor="default-mode" className="text-sm font-medium text-ink">
            Default question mode
          </label>
          <p className="mt-0.5 text-[13px] text-ink-mute">Used by the dashboard when the page opens.</p>
          <Select
            id="default-mode"
            className="mt-3 max-w-sm"
            value={settings.defaultMode}
            onChange={(e) => setSettings({ defaultMode: e.target.value as PracticeMode })}
            options={MODE_OPTIONS}
          />
        </div>

        <Switch
          checked={settings.showExplanations}
          onChange={(v) => setSettings({ showExplanations: v })}
          label="Show explanations after submission"
          description="Turn this off when you want to check answers without the solution in view."
        />
        <Switch
          checked={settings.allowRetryAfterCorrect}
          onChange={(v) => setSettings({ allowRetryAfterCorrect: v })}
          label="Offer a retry after a correct answer"
          description="Adds a “Try again” button next to “Next question”."
        />
        <Switch
          checked={settings.showQuestionImages}
          onChange={(v) => setSettings({ showQuestionImages: v })}
          label="Show question figures"
          description="Diagrams and Gantt charts are hidden when this is off."
        />
        <Switch
          checked={settings.natStrict}
          onChange={(v) => setSettings({ natStrict: v })}
          label="Strict matching for numerical answers"
          description="On: 2 and 2.0 are different. Off: any numerically equal value is accepted, within the tolerance set on the question."
        />
        <Switch
          checked={settings.swipeToAdvance}
          onChange={(v) => setSettings({ swipeToAdvance: v })}
          label="Swipe up to go to the next question"
          description="After you submit, drag the green button upwards to move on without tapping. Turn off if you prefer only buttons."
        />
      </Section>

      {/* Data */}
      <Section title="Data" description="Everything is stored in this browser only. Nothing is uploaded anywhere.">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          {[
            { label: 'Attempted', value: records.attempted },
            { label: 'Notes', value: records.notes + records.subjectNotes },
            { label: 'Revision', value: records.revision },
            { label: 'Wrong', value: records.wrong },
            { label: 'Questions in bank', value: total },
            { label: 'Storage used', value: usage.available ? `${Math.max(1, Math.round(usage.bytes / 1024))} KB` : 'n/a' },
          ].map((s) => (
            <div key={s.label} className="bg-surface px-3 py-3">
              <p className="text-2xs uppercase tracking-wider text-ink-mute">{s.label}</p>
              <p className="mt-1 text-[15px] font-semibold tabular-nums text-ink">{s.value.toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 py-4">
          <Button
            size="sm"
            onClick={() => {
              downloadUserData(user);
              toast('Export downloaded', 'success');
            }}
            iconLeft={<Download aria-hidden className="size-3.5" />}
          >
            Export progress
          </Button>
          <Button
            size="sm"
            onClick={() => fileRef.current?.click()}
            iconLeft={<Upload aria-hidden className="size-3.5" />}
          >
            Import progress
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onImport(file);
              e.target.value = '';
            }}
          />
        </div>

        {importError && (
          <div className="pb-4">
            <ErrorState compact title="That file could not be imported" message={importError} />
          </div>
        )}

        <div className="border-t border-line py-4">
          <p className="text-sm font-medium text-ink">Reset</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink-mute">
            Resetting cannot be undone. Export first if you want a copy.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setConfirmReset('wrong')}>
              Clear wrong list
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmReset('revision')}>
              Clear revision
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmReset('notes')}>
              Delete all notes
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmReset('progress')}>
              Clear attempt history
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setConfirmReset('all')}
              iconLeft={<Trash2 aria-hidden className="size-3.5" />}
            >
              Reset everything
            </Button>
          </div>
        </div>
      </Section>

      {/* About */}
      <Section title="About">
        <dl className="divide-y divide-line py-1 text-[13px]">
          {[
            ['Application', 'GATE Practice'],
            ['Target exam', 'GATE 2027 · Computer Science'],
            ['Questions in bank', total.toLocaleString('en-IN')],
            ['Question index built', new Date().toISOString().slice(0, 10)],
            ['Storage', 'Browser local storage, on this device only'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-ink-mute">{k}</dt>
              <dd className="text-right font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="flex items-start gap-2 py-4 text-2xs leading-relaxed text-ink-mute">
          <Info aria-hidden className="mt-px size-3.5 shrink-0" />
          Question content here is a small development sample. Replace the files in{' '}
          <code className="rounded bg-sunken px-1 py-0.5 font-mono">src/data/questions</code> with real GATE papers —
          each year is one file, and the app picks it up on the next build.
        </p>
        {issues.length > 0 && (
          <div className="pb-4">
            <ErrorState
              compact
              title={`${issues.length} issue${issues.length === 1 ? '' : 's'} in the question bank`}
              message={issues
                .slice(0, 4)
                .map((i) => `${i.file}: ${i.message}`)
                .join(' · ')}
            />
          </div>
        )}
      </Section>

      <Modal
        open={confirmReset !== null}
        onClose={() => setConfirmReset(null)}
        title="Confirm reset"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setConfirmReset(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (!confirmReset) return;
                reset(confirmReset);
                setConfirmReset(null);
                toast('Reset complete');
              }}
            >
              Yes, reset
            </Button>
          </div>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-soft">
          {confirmReset === 'all'
            ? 'This removes every attempt, note, revision mark and wrong answer, and returns the app to a blank state. Your theme and preferences are kept.'
            : confirmReset === 'progress'
              ? 'This removes all attempt history, accuracy statistics and the recently viewed list.'
              : confirmReset === 'notes'
                ? 'This deletes every question note and subject note.'
                : confirmReset === 'revision'
                  ? 'This empties the revision list. Attempts and notes are kept.'
                  : 'This empties the wrong questions list. Attempts and notes are kept.'}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Badge tone="warn">This cannot be undone</Badge>
        </div>
      </Modal>
    </div>
  );
}

export default Settings;
