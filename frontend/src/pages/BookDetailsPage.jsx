import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookUp, Pencil, RotateCcw } from 'lucide-react';
import { fetchBookDetails, returnBook, getErrorMessage } from '../api/client';
import { formatDate } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';
import IssueBookModal from '../components/IssueBookModal';
import BookFormModal from '../components/BookFormModal';

export default function BookDetailsPage({ onDataChange }) {
  const { id } = useParams();

  const [book, setBook] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [returningId, setReturningId] = useState(null);

  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchBookDetails(id);
      setBook(data.book);
      setLoans(data.loans);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load book details'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  async function handleReturn(loanId) {
    setReturningId(loanId);
    setError('');
    try {
      const res = await returnBook(loanId);
      const fine = res.data?.fine ?? 0;
      setNotice(
        fine > 0
          ? `Book returned. Late fine calculated: ₹${fine}`
          : 'Book returned on time (₹0 fine).'
      );
      await loadDetails();
      onDataChange();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to return book'));
    } finally {
      setReturningId(null);
    }
  }

  function handleActionSaved(message) {
    setNotice(message);
    loadDetails();
    onDataChange();
  }

  return (
    <div>
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        Back to Book Collection
      </Link>

      {notice && (
        <div className="alert alert-success">
          <span>{notice}</span>
          <button type="button" className="icon-btn" onClick={() => setNotice('')}>
            ✕
          </button>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="panel empty-state">Loading book details...</div>
      ) : !book ? (
        <div className="panel empty-state">Book not found.</div>
      ) : (
        <div className="panel">
          <div className="details-header">
            <div>
              <span className="code-pill">{book.bookCode}</span>
              <h1 style={{ fontSize: '1.35rem', marginTop: '0.45rem' }}>{book.title}</h1>
              <div className="sub-text" style={{ fontSize: '0.9rem' }}>
                by {book.author}
              </div>
            </div>

            <div className="actions-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditModalOpen(true)}
              >
                <Pencil size={15} />
                Edit Book
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={book.availableCopies === 0}
                onClick={() => setIssueModalOpen(true)}
              >
                <BookUp size={15} />
                Issue Book
              </button>
            </div>
          </div>

          <div className="details-meta-grid">
            <div>
              <div className="meta-item-label">ISBN</div>
              <div className="meta-item-val">{book.isbn}</div>
            </div>
            <div>
              <div className="meta-item-label">Category</div>
              <div className="meta-item-val">{book.category}</div>
            </div>
            <div>
              <div className="meta-item-label">Availability</div>
              <div className="meta-item-val">
                <span
                  className={`copies-text ${
                    book.availableCopies === 0 ? 'copies-zero' : ''
                  }`}
                >
                  {book.availableCopies} / {book.totalCopies} available
                </span>
              </div>
            </div>
            <div>
              <div className="meta-item-label">Total Loans</div>
              <div className="meta-item-val">{loans.length}</div>
            </div>
          </div>

          <div className="section-heading">
            <h2>Loan History</h2>
          </div>

          {loans.length === 0 ? (
            <div className="empty-state">No loans recorded for this book yet.</div>
          ) : (
            <>
              <div className="table-wrap desktop-table">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Member Name</th>
                      <th>Member ID</th>
                      <th>Issue Date</th>
                      <th>Due Date</th>
                      <th>Return Date</th>
                      <th>Fine</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((loan) => (
                      <tr key={loan._id}>
                        <td style={{ fontWeight: 500 }}>{loan.memberName}</td>
                        <td>
                          <span className="code-pill">{loan.memberId}</span>
                        </td>
                        <td>{formatDate(loan.issueDate)}</td>
                        <td>{formatDate(loan.dueDate)}</td>
                        <td>{formatDate(loan.returnDate)}</td>
                        <td style={{ fontWeight: 600 }}>₹{loan.fine}</td>
                        <td>
                          <StatusBadge
                            status={loan.status}
                            isOverdue={loan.isOverdue}
                          />
                        </td>
                        <td>
                          {loan.status === 'Issued' ? (
                            <button
                              type="button"
                              className="btn btn-outline-success btn-sm"
                              disabled={returningId === loan._id}
                              onClick={() => handleReturn(loan._id)}
                            >
                              <RotateCcw size={14} />
                              {returningId === loan._id ? 'Returning...' : 'Return'}
                            </button>
                          ) : (
                            <span className="sub-text">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mobile-cards">
                {loans.map((loan) => (
                  <div className="mobile-card" key={loan._id}>
                    <div className="mobile-card-top">
                      <div>
                        <div style={{ fontWeight: 600 }}>{loan.memberName}</div>
                        <div className="sub-text">ID: {loan.memberId}</div>
                      </div>
                      <StatusBadge status={loan.status} isOverdue={loan.isOverdue} />
                    </div>

                    <div className="mobile-card-meta">
                      <span>Issued: {formatDate(loan.issueDate)}</span>
                      <span>•</span>
                      <span>Due: {formatDate(loan.dueDate)}</span>
                      <span>•</span>
                      <span>Returned: {formatDate(loan.returnDate)}</span>
                      <span>•</span>
                      <span>Fine: ₹{loan.fine}</span>
                    </div>

                    {loan.status === 'Issued' && (
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        disabled={returningId === loan._id}
                        onClick={() => handleReturn(loan._id)}
                      >
                        <RotateCcw size={14} />
                        {returningId === loan._id ? 'Returning...' : 'Return Book'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <IssueBookModal
        isOpen={issueModalOpen}
        book={book}
        onClose={() => setIssueModalOpen(false)}
        onIssued={handleActionSaved}
      />

      <BookFormModal
        isOpen={editModalOpen}
        book={book}
        onClose={() => setEditModalOpen(false)}
        onSaved={handleActionSaved}
      />
    </div>
  );
}
