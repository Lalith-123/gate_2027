import { type ClassValue, clsx } from 'clsx';

/** Joins class names, dropping falsy values. Used everywhere. */
export function cn(...values: ClassValue[]): string {
  return clsx(values);
}
