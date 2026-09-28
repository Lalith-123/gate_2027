import { memo, useMemo } from 'react';
import { renderMath, tokeniseMath, type Token } from '@/lib/math';
import { cn } from '@/lib/cn';

interface MathTextProps {
  children: string;
  className?: string;
}

/** Renders a string that may contain `$inline$` and `$$display$$` mathematics. */
export const MathText = memo(function MathText({ children, className }: MathTextProps) {
  const tokens = useMemo<Token[]>(() => tokeniseMath(children ?? ''), [children]);

  return (
    <span className={className}>
      {tokens.map((token, i) => {
        if (token.kind === 'text') return <span key={i}>{token.value}</span>;
        const { html, error } = renderMath(token.value, Boolean(token.display));
        if (error) return <span key={i}>{`$${token.value}$`}</span>;
        return (
          <span key={i} className={cn(token.display && 'block')} dangerouslySetInnerHTML={{ __html: html }} />
        );
      })}
    </span>
  );
});
