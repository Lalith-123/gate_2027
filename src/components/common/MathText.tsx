import { useMemo } from 'react';
import { renderMath, tokeniseMath } from '@/utils/math';

/**
 * Renders question / explanation / option text, interpreting `$...$` and
 * `$$...$$` as KaTeX and leaving everything else as plain text.
 *
 * The split matters: user-authored text is never passed to
 * dangerouslySetInnerHTML as a whole, only the output of KaTeX's own
 * renderer, which runs with `trust: false`.
 */
export function MathText({
  children,
  as: Tag = 'div',
  className,
}: {
  children: string;
  as?: 'div' | 'p' | 'span' | 'li';
  className?: string;
}) {
  const tokens = useMemo(() => tokeniseMath(children ?? ''), [children]);

  return (
    <Tag className={className}>
      {tokens.map((t, i) =>
        t.kind === 'math' ? (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className={t.display ? 'block' : 'inline-block align-[-0.1em]'}
            dangerouslySetInnerHTML={{ __html: renderMath(t.value, Boolean(t.display)) }}
          />
        ) : (
          <span key={i}>{t.value}</span>
        ),
      )}
    </Tag>
  );
}
