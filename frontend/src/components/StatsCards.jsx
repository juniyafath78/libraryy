import { BookOpen, BookMarked, AlertTriangle, IndianRupee } from 'lucide-react';

export default function StatsCards({ stats, loading }) {
  const valueOrDash = (val) => (loading && !stats ? '—' : val);

  return (
    <section className="stats-grid" aria-label="Library statistics">
      <div className="stat-card">
        <div>
          <div className="stat-label">Collection</div>
          <div className="stat-value">{valueOrDash(stats?.totalTitles ?? 0)} Titles</div>
          <div className="stat-sub">
            {valueOrDash(stats?.totalCopies ?? 0)} total copies
          </div>
        </div>
        <div className="stat-icon blue">
          <BookOpen size={20} />
        </div>
      </div>

      <div className="stat-card">
        <div>
          <div className="stat-label">Currently Issued</div>
          <div className="stat-value">{valueOrDash(stats?.issuedCopies ?? 0)}</div>
          <div className="stat-sub">Copies out with members</div>
        </div>
        <div className="stat-icon amber">
          <BookMarked size={20} />
        </div>
      </div>

      <div className="stat-card">
        <div>
          <div className="stat-label">Overdue Loans</div>
          <div className="stat-value">{valueOrDash(stats?.overdueLoans ?? 0)}</div>
          <div className="stat-sub">Past 14-day due date</div>
        </div>
        <div className="stat-icon red">
          <AlertTriangle size={20} />
        </div>
      </div>

      <div className="stat-card">
        <div>
          <div className="stat-label">Fine Collected</div>
          <div className="stat-value">
            ₹{valueOrDash(stats?.totalFineCollected ?? 0)}
          </div>
          <div className="stat-sub">From returned loans</div>
        </div>
        <div className="stat-icon green">
          <IndianRupee size={20} />
        </div>
      </div>
    </section>
  );
}
