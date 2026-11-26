import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getTodayInputValue, addDaysFormatted } from '../utils/formatters';
import { issueBook, getErrorMessage } from '../api/client';

export default function IssueBookModal({ isOpen, book, onClose, onIssued }) {
  const todayStr = getTodayInputValue();

  const [memberName, setMemberName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [issueDate, setIssueDate] = useState(todayStr);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMemberName('');
    setMemberId('');
    setIssueDate(getTodayInputValue());
    setFieldErrors({});
    setServerError('');
  }, [isOpen, book]);

  if (!isOpen || !book) return null;

  function validate() {
    const errors = {};
    const currentToday = getTodayInputValue();

    if (!memberName.trim()) {
      errors.memberName = 'Member name is required';
    }
    if (!memberId.trim()) {
      errors.memberId = 'Member ID is required';
    }
    if (!issueDate) {
      errors.issueDate = 'Issue date is required';
    } else if (issueDate > currentToday) {
      errors.issueDate = 'Issue date cannot be in the future';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await issueBook({
        bookId: book._id,
        memberName: memberName.trim(),
        memberId: memberId.trim(),
        issueDate
      });
      onIssued(`Issued "${book.title}" to ${memberName.trim()}`);
      onClose();
    } catch (err) {
      setServerError(getErrorMessage(err, 'Failed to issue book'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Issue Book</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <div style={{ marginBottom: '1rem' }}>
              <span className="code-pill">{book.bookCode}</span>
              <div style={{ fontWeight: 600, marginTop: '0.4rem' }}>{book.title}</div>
              <div className="sub-text">
                {book.availableCopies} of {book.totalCopies} copies available
              </div>
            </div>

            {serverError && <div className="alert alert-error">{serverError}</div>}

            <div className="form-grid">
              <div>
                <label className="field-label" htmlFor="member-name">
                  Member Name
                </label>
                <input
                  id="member-name"
                  className="input"
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="e.g. Ananya Rao"
                />
                {fieldErrors.memberName && (
                  <div className="field-error">{fieldErrors.memberName}</div>
                )}
              </div>

              <div>
                <label className="field-label" htmlFor="member-id">
                  Member ID
                </label>
                <input
                  id="member-id"
                  className="input"
                  type="text"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  placeholder="e.g. MEM-205"
                />
                {fieldErrors.memberId && (
                  <div className="field-error">{fieldErrors.memberId}</div>
                )}
              </div>

              <div>
                <label className="field-label" htmlFor="issue-date">
                  Issue Date
                </label>
                <input
                  id="issue-date"
                  className="input"
                  type="date"
                  max={todayStr}
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
                {fieldErrors.issueDate ? (
                  <div className="field-error">{fieldErrors.issueDate}</div>
                ) : (
                  <div className="field-hint">
                    Due Date (14 days): {addDaysFormatted(issueDate, 14)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Issuing...' : 'Confirm Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
