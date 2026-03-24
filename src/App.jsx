import { useState } from 'react';
import Layout from './components/Layout/Layout';
import SummaryPage from './pages/SummaryPage';
import RecordsPage from './pages/RecordsPage';
import { ToastProvider } from './context/ToastContext';

export default function App() {
  const [activePage, setActivePage] = useState('summary');

  return (
    <ToastProvider>
      <Layout activePage={activePage} onNavigate={setActivePage}>
        {activePage === 'summary' && <SummaryPage />}
        {activePage === 'records' && <RecordsPage />}
      </Layout>
    </ToastProvider>
  );
}
