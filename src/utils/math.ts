import katex from 'katex';

export type MathToken = { kind: 'text' | 'math'; value: string; display?: boolean };

const TOKEN_RE = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

/**
 * Splits a string on `$...$` / `$$...$$` so mathematical notation can be
 * rendered with KaTeX while the surrounding prose stays normal text.
 * Unbalanced delimiters are left alone rather than throwing.
 */
export function tokeniseMath(input: string): MathToken[] {
  const out: MathToken[] = [];
  let cursor = 0;
  TOKEN_RE.lastIndex = 0;

  for (let match = TOKEN_RE.exec(input); match; match = TOKEN_RE.exec(input)) {
    if (match.index > cursor) out.push({ kind: 'text', value: input.slice(cursor, match.index) });
    if (match[1] !== undefined) out.push({ kind: 'math', value: match[1], display: true });
    else if (match[2] !== undefined) out.push({ kind: 'math', value: match[2], display: false });
    cursor = match.index + match[0].length;
  }

  if (cursor < input.length) out.push({ kind: 'text', value: input.slice(cursor) });
  return out.length ? out : [{ kind: 'text', value: input }];
}

/**
 * Renders one expression. `throwOnError: false` means a malformed expression
 * degrades to the source text instead of breaking the question.
 */
export function renderMath(expression: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expression, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      output: 'htmlAndMathml',
      trust: false,
    });
  } catch {
    return escapeHtml(expression);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
