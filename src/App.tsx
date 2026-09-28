import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ToastProvider } from '@/components/common/Toast';
import { BankProvider } from '@/state/BankProvider';
import { UserProvider } from '@/state/UserProvider';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const QuestionBank = lazy(() => import('@/pages/QuestionBank'));
const Subjects = lazy(() => import('@/pages/Subjects'));
const SubjectPractice = lazy(() => import('@/pages/SubjectPractice'));
const PoolPractice = lazy(() => import('@/pages/PoolPractice'));
const SingleQuestion = lazy(() => import('@/pages/SingleQuestion'));
const Revision = lazy(() => import('@/pages/Revision'));
const WrongQuestions = lazy(() => import('@/pages/WrongQuestions'));
const Notes = lazy(() => import('@/pages/Notes'));
const Progress = lazy(() => import('@/pages/Progress'));
const Settings = lazy(() => import('@/pages/Settings'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <BankProvider>
          <ToastProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="bank" element={<QuestionBank />} />
                <Route path="subjects" element={<Subjects />} />
                <Route path="subject/:name" element={<SubjectPractice />} />
                <Route path="practice/pool" element={<PoolPractice />} />
                <Route path="practice/:id" element={<SingleQuestion />} />
                <Route path="revision" element={<Revision />} />
                <Route path="wrong" element={<WrongQuestions />} />
                <Route path="notes" element={<Notes />} />
                <Route path="progress" element={<Progress />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </ToastProvider>
        </BankProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
