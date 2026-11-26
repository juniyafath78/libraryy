import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Library } from 'lucide-react';
import { fetchStats } from './api/client';
import StatsCards from './components/StatsCards';
import BooksPage from './pages/BooksPage';
import BookDetailsPage from './pages/BookDetailsPage';

export default function App() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <div className="brand-icon">
              <Library size={20} />
            </div>
            <div>
              <div className="brand-title">Library Book Lending Manager</div>
              <div className="brand-sub">Collection, Loans &amp; Fine Tracking</div>
            </div>
          </Link>
        </div>
      </header>

      <main className="container">
        <StatsCards stats={stats} loading={statsLoading} />

        <Routes>
          <Route path="/" element={<BooksPage onDataChange={loadStats} />} />
          <Route
            path="/books/:id"
            element={<BookDetailsPage onDataChange={loadStats} />}
          />
        </Routes>
      </main>
    </div>
  );
}
