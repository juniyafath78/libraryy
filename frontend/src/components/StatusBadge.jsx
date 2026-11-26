export default function StatusBadge({ status, isOverdue }) {
  if (isOverdue) {
    return <span className="badge badge-overdue">Overdue</span>;
  }
  if (status === 'Returned') {
    return <span className="badge badge-returned">Returned</span>;
  }
  return <span className="badge badge-issued">Issued</span>;
}
