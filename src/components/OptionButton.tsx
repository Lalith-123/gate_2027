import { MathText } from './MathText';

interface OptionButtonProps {
  label: string;
  text: string;
  selected: boolean;
  revealed: boolean;
  isCorrect: boolean;
  isUserAnswer: boolean;
  /** MSQ renders a square checkbox marker and toggles instead of replacing. */
  multiple: boolean;
  onClick: () => void;
}

export function OptionButton({
  label,
  text,
  selected,
  revealed,
  isCorrect,
  isUserAnswer,
  multiple,
  onClick,
}: OptionButtonProps) {
  const wrongPick = revealed && isUserAnswer && !isCorrect;

  let container =
    'w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-3 min-h-[56px]';

  if (revealed) {
    if (isCorrect) {
      container += ' border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30';
    } else if (wrongPick) {
      container += ' border-red-500 bg-red-50 dark:bg-red-900/30';
    } else {
      container += ' border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-50';
    }
  } else if (selected) {
    container += ' border-blue-500 bg-blue-50 dark:bg-blue-900/30';
  } else {
    container +=
      ' border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600';
  }

  if (!revealed) {
    container += ' cursor-pointer active:scale-[0.98]';
  }

  let marker =
    'flex-shrink-0 w-8 h-8 flex items-center justify-center text-sm font-bold text-white ';
  if (revealed) {
    if (isCorrect) marker += 'bg-emerald-500';
    else if (wrongPick) marker += 'bg-red-500';
    else marker += 'bg-slate-300 dark:bg-slate-600';
  } else if (selected) {
    marker += 'bg-blue-500';
  } else {
    marker += 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200';
  }

  if (multiple) marker = marker.replace('rounded-full', 'rounded-md');

  return (
    <button
      className={container}
      onClick={onClick}
      disabled={revealed}
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={selected}
      aria-label={`Option ${label}: ${text}`}
    >
      <span className={marker}>{label}</span>
      <MathText
        text={text}
        className="text-slate-800 dark:text-slate-100 text-[15px] leading-relaxed pt-0.5"
      />
    </button>
  );
}
