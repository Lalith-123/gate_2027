import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ToastProvider } from '@/components/common/Toast';
import { BankProvider } from '@/state/BankStore';
import { UserProvider } from '@/state/UserStore';
import { useTheme } from '@/hooks/useTheme';
import { PracticePage } from '@/pages/PracticePage';
import { QuestionBankPage } from '@/pages/QuestionBankPage';
import { SubjectsPage } from '@/pages/SubjectsPage';
import { RevisionPage, WrongPage } from '@/pages/RevisionPage';
import { NotesPage } from '@/pages/NotesPage';
import { ProgressPage } from '@/pages/ProgressPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import '@/styles.css';

/**
 * Provider order matters: user data (settings + progress) and the question
 * bank must both be ready before any page that reads them renders, and
 * `useTheme` has to run inside UserProvider.
 */
function ThemeBridge() {
  useTheme();
  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <ThemeBridge />
        <BankProvider>
          <ToastProvider>
            <ScrollToTop />
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<PracticePage />} />
                <Route path="practice" element={<PracticePage />} />
                <Route path="questions" element={<QuestionBankPage />} />
                <Route path="subjects" element={<SubjectsPage />} />
                <Route path="revision" element={<RevisionPage />} />
                <Route path="wrong" element={<WrongPage />} />
                <Route path="notes" element={<NotesPage />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="dashboard" element={<Navigate to="/" replace />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </BankProvider>
      </UserProvider>
    </BrowserRouter>
  );
}
