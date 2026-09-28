import { Page } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/common/Display';
import { ButtonLink } from '@/components/common/Button';
import { Compass } from 'lucide-react';

export function NotFoundPage() {
  return (
    <Page>
      <EmptyState
        icon={<Compass aria-hidden className="size-7" />}
        title="Page not found"
        description="That link does not lead anywhere in this app."
        action={<ButtonLink to="/" variant="primary">Go to practice</ButtonLink>}
      />
    </Page>
  );
}
