import { useRef, useState } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { Page, PageHeading } from '@/components/layout/AppShell';
import { SectionTitle } from '@/components/common/Display';
import { Button } from '@/components/common/Button';
import { Switch, Segmented, Select } from '@/components/common/Form';
import { ConfirmDialog } from '@/components/common/Overlay';
import { useUser } from '@/state/UserStore';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/common/Toast';
import { downloadUserData, readFile, countRecords } from '@/services/transferService';
import { storageUsage } from '@/services/storageService';
import { count } from '@/utils/format';
import type { PracticeMode } from '@/types/question';

/** Settings, data transfer and resets. */
export function SettingsPage() {
  const { user, settings, updateSettings, reset, replaceAll } = useUser();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [resetting, setResetting] = useState<null | 'progress' | 'notes' | 'revision' | 'wrong' | 'all'>(null);

  const usage = storageUsage();
  const records = countRecords(user);

  const importFile = async (file: File) => {
    const result = await readFile(file);
    if (!result.ok || !result.data) {
      toast(result.message || 'That file could not be read');
      return;
    }
    replaceAll(result.data);
    const n = countRecords(result.data);
    toast(`Imported ${count(n.attempted)} answered questions and ${count(n.notes)} notes`);
  };

  return (
    <Page>
      <PageHeading title="Settings" description="Preferences are stored on this device." />

      <div className="space-y-8">
        <section>
          <SectionTitle>Appearance</SectionTitle>
          <Segmented
            legend="Theme"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
          <div className="mt-2">
            <Switch
              label="Reduce motion"
              description="Turns off the small transitions used when questions change."
              checked={settings.reduceMotion}
              onChange={(v) => updateSettings({ reduceMotion: v })}
            />
          </div>
        </section>

        <section>
          <SectionTitle>Practice</SectionTitle>
          <Select
            label="Default mode when you open the app"
            value={settings.defaultMode}
            onChange={(e) => updateSettings({ defaultMode: e.target.value as PracticeMode })}
            options={[
              { value: 'random', label: 'Mixed' },
              { value: 'unattempted', label: 'Unattempted' },
              { value: 'wrong', label: 'Wrong answers' },
              { value: 'revision', label: 'Revision' },
              { value: 'difficult', label: 'Difficult' },
            ]}
            className="max-w-xs"
          />

          <div className="mt-2 max-w-lg divide-y divide-hair">
            <Switch
              label="Show explanations"
              description="Explanations appear after you submit an answer."
              checked={settings.showExplanations}
              onChange={(v) => updateSettings({ showExplanations: v })}
            />
            <Switch
              label="Allow another attempt after a correct answer"
              description="Lets you retry a question you already answered correctly in this session."
              checked={settings.allowRetryAfterCorrect}
              onChange={(v) => updateSettings({ allowRetryAfterCorrect: v })}
            />
            <Switch
              label="Swipe up to go to the next question"
              description="An optional shortcut on the action bar. Submit and Next buttons always work."
              checked={settings.swipeToAdvance}
              onChange={(v) => updateSettings({ swipeToAdvance: v })}
            />
            <Switch
              label="Show question images"
              description="Turn off to save data on slow connections."
              checked={settings.showQuestionImages}
              onChange={(v) => updateSettings({ showQuestionImages: v })}
            />
            <Switch
              label="Strict NAT matching"
              description="Require an exact value instead of accepting a small tolerance."
              checked={settings.natStrict}
              onChange={(v) => updateSettings({ natStrict: v })}
            />
          </div>
        </section>

        <section>
          <SectionTitle>Your data</SectionTitle>
          <p className="mb-3 text-[13px] leading-relaxed text-fg2">
            Everything is stored in this browser only — there is no account and nothing is
            uploaded.{' '}
            {usage.available && `${Math.round(usage.bytes / 1024)} KB used. `}
            Clearing site data will erase your progress, so export a backup if you want to keep it.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                downloadUserData(user);
                toast('Backup downloaded');
              }}
              icon={<Download aria-hidden className="size-4" />}
            >
              Export backup
            </Button>
            <Button
              onClick={() => fileInput.current?.click()}
              icon={<Upload aria-hidden className="size-4" />}
            >
              Import backup
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void importFile(file);
              }}
            />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Record label="Answered" value={count(records.attempted)} />
            <Record label="Notes" value={count(records.notes)} />
            <Record label="For revision" value={count(records.revision)} />
            <Record label="Wrong" value={count(records.wrong)} />
          </dl>
        </section>

        <section>
          <SectionTitle>Reset</SectionTitle>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setResetting('progress')}>Reset progress</Button>
            <Button onClick={() => setResetting('notes')}>Delete all notes</Button>
            <Button onClick={() => setResetting('revision')}>Clear revision list</Button>
            <Button onClick={() => setResetting('wrong')}>Clear wrong answers</Button>
            <Button variant="danger" onClick={() => setResetting('all')} icon={<Trash2 aria-hidden className="size-4" />}>
              Erase everything
            </Button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={resetting !== null}
        onClose={() => setResetting(null)}
        onConfirm={() => {
          if (!resetting) return;
          reset(resetting);
          toast('Done');
        }}
        title={
          resetting === 'all'
            ? 'Erase all data?'
            : resetting === 'progress'
              ? 'Reset all progress?'
              : 'This cannot be undone'
        }
        message={
          resetting === 'all'
            ? 'This deletes every attempt, note, mark and setting stored in this browser. Export a backup first if you may want it back.'
            : 'This cannot be undone.'
        }
        confirmLabel="Reset"
        danger
      />
    </Page>
  );
}

function Record({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface px-3 py-2.5">
      <dt className="text-2xs text-fg2">{label}</dt>
      <dd className="tnum mt-0.5 text-lg font-semibold text-fg">{value}</dd>
    </div>
  );
}
