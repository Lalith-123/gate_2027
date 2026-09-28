import katex from 'katex';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

const MathTextContext = createContext<{ enabled: boolean }>({ enabled: true });

export function MathProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => ({ enabled: true }), []);
  return <MathTextContext.Provider value={value}>{children}</MathTextContext.Provider>;
}

export const useMathEnabled = () => useContext(MathTextContext).enabled;

export type Token = { kind: 'text' | 'math'; value: string; display?: boolean };

const TOKEN_RE = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

/**
 * Splits a string on `$...$` / `$$...$$` so mathematical notation can be
 * rendered with KaTeX while the surrounding prose stays as normal text.
 * Unbalanced delimiters are left alone rather than throwing.
 */
export function tokeniseMath(input: string): Token[] {
  const out: Token[] = [];
  let cursor = 0;
  TOKEN_RE.lastIndex = 0;

  for (let match = TOKEN_RE.exec(input); match; match = TOKEN_RE.exec(input)) {
    if (match.index > cursor) out.push({ kind: 'text', value: input.slice(cursor, match.index) });
    if (match[1] !== undefined) {
      out.push({ kind: 'math', value: match[1], display: true });
    } else if (match[2] !== undefined) {
      out.push({ kind: 'math', value: match[2], display: false });
    }
    cursor = match.index + match[0].length;
  }

  if (cursor < input.length) out.push({ kind: 'text', value: input.slice(cursor) });
  return out.length ? out : [{ kind: 'text', value: input }];
}

export function renderMath(expression: string, displayMode: boolean): { html: string; error: boolean } {
  try {
    return {
      html: katex.renderToString(expression, {
        displayMode,
        throwOnError: false,
        strict: 'ignore',
        output: 'html',
        trust: false,
      }),
      error: false,
    };
  } catch {
    return { html: '', error: true };
  }
}
