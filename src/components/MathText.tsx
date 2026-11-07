import type { ReactNode } from 'react';
import katex from 'katex';

/**
 * `$$...$$` and `\[...\]` are display math; `$...$` and `\(...\)` are inline.
 * `\$` is a literal dollar sign.
 */
const MATH_PATTERN =
  /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$((?:[^$\\]|\\.)+?)\$|\\\(([\s\S]+?)\\\)/g;

interface MathProps {
  text: string;
  className?: string;
}

/**
 * Renders question text with LaTeX math typeset. Anything that fails to parse
 * falls back to the raw `$...$` source rather than throwing, so a malformed
 * formula can never blank out a question.
 */
export function MathText({ text, className }: MathProps) {
  const nodes: ReactNode[] = [];
  const pattern = new RegExp(MATH_PATTERN.source, 'g');
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    const display = match[1] !== undefined || match[2] !== undefined;
    const body = match[1] ?? match[2] ?? match[3] ?? match[4] ?? '';

    try {
      nodes.push(
        <span
          key={key++}
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(body, {
              displayMode: display,
              output: 'html',
              throwOnError: false,
              strict: false,
            }),
          }}
        />
      );
    } catch {
      nodes.push(match[0]);
    }

    cursor = pattern.lastIndex;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return <span className={className}>{nodes}</span>;
}
