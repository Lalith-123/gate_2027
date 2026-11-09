import { useState, useCallback, useMemo } from 'react';
import { useQuestions } from './hooks/useQuestions';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { QuestionCard } from './components/QuestionCard';
import { FilterPanel } from './components/FilterPanel';
import { BookmarksPanel } from './components/BookmarksPanel';
import { IncorrectPanel } from './components/IncorrectPanel';
import { SubjectNotesPanel } from './components/SubjectNotesPanel';
import { StatsBar } from './components/StatsBar';
import { LoadingSkeleton, EmptyState } from './components/States';
import { isBookmarked, getNote, loadSubjectNotes, saveSubjectNotes, upsertSubjectNote } from './utils/storage';
import { getPaperKey, getPaperLabel } from './utils/filters';

function App() {
  const {
    currentQuestion,
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
  } = useQuestions();

  const { theme, toggleTheme } = useTheme();
  const [isLoading] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isIncorrectOpen, setIsIncorrectOpen] = useState(false);
  const [isSubjectNotesOpen, setIsSubjectNotesOpen] = useState(false);
  const [subjectNotes, setSubjectNotes] = useState(() => loadSubjectNotes());

  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    allQuestions.forEach((q) => {
      if (q.classification.subject) subjects.add(q.classification.subject);
    });
    return Array.from(subjects).sort();
  }, [allQuestions]);

  const handleSaveSubjectNote = useCallback((subject: string, text: string) => {
    const updated = upsertSubjectNote(subjectNotes, subject, text);
    setSubjectNotes(updated);
    saveSubjectNotes(updated);
  }, [subjectNotes]);

  const paperLabels = useMemo(() => {
    const map = new Map<string, string>();
    allQuestions.forEach((question) => {
      const key = getPaperKey(question);
      if (!map.has(key)) map.set(key, getPaperLabel(question.classification.subject, key));
    });
    return map;
  }, [allQuestions]);

  const activeFilters: string[] = [];
  if (filters.subjects.length === 1) activeFilters.push(filters.subjects[0]);
  else if (filters.subjects.length > 1) activeFilters.push(`${filters.subjects.length} subjects`);

  if (filters.papers.length === 1) activeFilters.push(paperLabels.get(filters.papers[0]) ?? filters.papers[0]);
  else if (filters.papers.length > 1) activeFilters.push(`${filters.papers.length} papers`);

  if (filters.onlyIncorrect) activeFilters.push('Only incorrect');
  if (filters.onlySaved) activeFilters.push('Only saved');

  const handleNext = useCallback(() => {
    goToNext();
  }, [goToNext]);

  const incorrectCount = attempts.filter((a) => !a.isCorrect).length;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-200">
      <Header
        onFilterClick={() => setIsFilterOpen(true)}
        onBookmarksClick={() => setIsBookmarksOpen(true)}
        onIncorrectClick={() => setIsIncorrectOpen(true)}
        onSubjectNotesClick={() => setIsSubjectNotesOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        activeFilters={activeFilters}
        bookmarkCount={bookmarks.length}
        incorrectCount={incorrectCount}
        subjectNoteCount={subjectNotes.length}
      />

      <StatsBar stats={stats} />

      {isLoading ? (
        <LoadingSkeleton />
      ) : currentQuestion ? (
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          attempt={viewFresh ? undefined : attempts.find((a) => a.questionId === currentQuestion.id)}
          isBookmarked={isBookmarked(bookmarks, currentQuestion.id)}
          note={getNote(notes, currentQuestion.id)}
          onRecordAttempt={recordAttempt}
          onToggleBookmark={toggleBook}
          onSaveNote={saveNote}
          onNext={handleNext}
        />
      ) : (
        <EmptyState onClearFilters={clearFilters} />
      )}

      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onClear={clearFilters}
        allQuestions={allQuestions}
      />

      <BookmarksPanel
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={bookmarks}
        allQuestions={allQuestions}
        attempts={attempts}
        onGoToQuestion={goToQuestion}
        onRemoveBookmark={toggleBook}
      />

      <IncorrectPanel
        isOpen={isIncorrectOpen}
        onClose={() => setIsIncorrectOpen(false)}
        attempts={attempts}
        allQuestions={allQuestions}
        onGoToQuestion={goToQuestion}
        onRemoveIncorrect={removeIncorrect}
      />

      <SubjectNotesPanel
        isOpen={isSubjectNotesOpen}
        onClose={() => setIsSubjectNotesOpen(false)}
        subjects={uniqueSubjects}
        subjectNotes={subjectNotes}
        onSave={handleSaveSubjectNote}
      />

      <div className="fixed bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-slate-950 to-transparent pointer-events-none z-30" />
    </div>
  );
}

export default App;
