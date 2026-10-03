import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Filters, AttemptRecord, BookmarkRecord, NoteRecord, Question } from '../types';
import { getQuestions } from '../data/loader';
import { filterQuestions, shuffleArray } from '../utils/filters';
import {
  loadAttempts,
  saveAttempts,
  addAttempt,
  removeAttempt,
  loadBookmarks,
  saveBookmarks,
  toggleBookmark,
  loadNotes,
  saveNotes,
  upsertNote,
} from '../utils/storage';

/** Keeps recently served questions out of the reshuffle so they do not repeat back-to-back. */
const SESSION_WINDOW = 20;

const DEFAULT_FILTERS: Filters = {
  exam: 'all',
  year: 'all',
  branch: 'all',
  subject: 'all',
  topic: 'all',
  subtopic: 'all',
  type: 'all',
  difficulty: 'all',
  source: 'all',
  status: 'all',
};

export function useQuestions() {
  const allQuestions = useMemo(() => getQuestions(), []);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [attempts, setAttempts] = useState<AttemptRecord[]>(() => loadAttempts());
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>(() => loadBookmarks());
  const [notes, setNotes] = useState<NoteRecord[]>(() => loadNotes());
  const [currentQueue, setCurrentQueue] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewFresh, setViewFresh] = useState(false);

  const sessionHistoryRef = useRef<string[]>([]);
  const filteredRef = useRef<Question[]>(allQuestions);

  const filteredQuestions = useMemo(
    () => filterQuestions(allQuestions, filters, attempts, bookmarks),
    [allQuestions, filters, attempts, bookmarks]
  );

  useEffect(() => {
    filteredRef.current = filteredQuestions;
  }, [filteredQuestions]);

  const rebuildQueue = useCallback(() => {
    const pool = filteredRef.current;
    if (pool.length === 0) {
      setCurrentQueue([]);
      setCurrentIndex(0);
      return;
    }
    const window = Math.min(SESSION_WINDOW, Math.floor(pool.length / 2));
    const eligible = pool.filter((q) => !sessionHistoryRef.current.includes(q.id));
    setCurrentQueue(shuffleArray(eligible.length > 0 ? eligible : pool));
    setCurrentIndex(0);
  }, []);

  useEffect(() => {
    rebuildQueue();
  }, [filters, rebuildQueue]);

  const currentQuestion = currentQueue[currentIndex] || null;

  const goToNext = useCallback(() => {
    setViewFresh(false);

    const nextIndex = currentIndex + 1;
    if (nextIndex < currentQueue.length) {
      setCurrentIndex(nextIndex);
      const served = currentQueue[nextIndex].id;
      sessionHistoryRef.current = [...sessionHistoryRef.current, served].slice(-SESSION_WINDOW);
      return;
    }

    const pool = filteredRef.current;
    if (pool.length === 0) {
      setCurrentQueue([]);
      setCurrentIndex(0);
      return;
    }

    sessionHistoryRef.current = [
      ...sessionHistoryRef.current,
      ...currentQueue.map((q) => q.id),
    ].slice(-SESSION_WINDOW);
    const window = Math.min(SESSION_WINDOW, Math.floor(pool.length / 2));
    const eligible = pool.filter((q) => !sessionHistoryRef.current.slice(-window).includes(q.id));
    setCurrentQueue(shuffleArray(eligible.length > 0 ? eligible : pool));
    setCurrentIndex(0);
  }, [currentIndex, currentQueue]);

  const recordAttempt = useCallback(
    (questionId: string, selectedOption: string, isCorrect: boolean) => {
      setAttempts((previous) => {
        const updated = addAttempt(previous, {
          questionId,
          selectedOption,
          isCorrect,
          lastAttemptedAt: Date.now(),
        });
        saveAttempts(updated);
        return updated;
      });
    },
    []
  );

  const toggleBook = useCallback((questionId: string) => {
    setBookmarks((previous) => {
      const updated = toggleBookmark(previous, questionId);
      saveBookmarks(updated);
      return updated;
    });
  }, []);

  const removeIncorrect = useCallback((questionId: string) => {
    setAttempts((previous) => {
      const updated = removeAttempt(previous, questionId);
      saveAttempts(updated);
      return updated;
    });
  }, []);

  const saveNote = useCallback((questionId: string, text: string) => {
    setNotes((previous) => {
      const updated = upsertNote(previous, questionId, text);
      saveNotes(updated);
      return updated;
    });
  }, []);

  const goToQuestion = useCallback((questionId: string) => {
    setViewFresh(true);
    const index = currentQueue.findIndex((q) => q.id === questionId);
    if (index !== -1) {
      setCurrentIndex(index);
      return;
    }
    const question = filteredRef.current.find((q) => q.id === questionId);
    if (question) {
      setCurrentQueue([question]);
      setCurrentIndex(0);
    }
  }, [currentQueue]);

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const stats = useMemo(() => {
    const byId = new Map(allQuestions.map((q) => [q.id, q]));
    let marks = 0;
    let possible = 0;
    for (const attempt of attempts) {
      const question = byId.get(attempt.questionId);
      if (!question) continue;
      possible += question.question.marks;
      marks += attempt.isCorrect ? question.question.marks : -question.question.negativeMarks;
    }
    return {
      total: filteredQuestions.length,
      attempted: attempts.length,
      correct: attempts.filter((a) => a.isCorrect).length,
      incorrect: attempts.filter((a) => !a.isCorrect).length,
      bookmarked: bookmarks.length,
      marks: Math.round(marks * 100) / 100,
      possible,
    };
  }, [allQuestions, attempts, bookmarks, filteredQuestions]);

  return {
    currentQuestion,
    filteredQuestions,
    allQuestions,
    filters,
    setFilters,
    attempts,
    bookmarks,
    notes,
    isFilterOpen,
    setIsFilterOpen,
    goToNext,
    goToQuestion,
    viewFresh,
    recordAttempt,
    toggleBook,
    removeIncorrect,
    saveNote,
    clearFilters,
    stats,
    totalFiltered: filteredQuestions.length,
  };
}
