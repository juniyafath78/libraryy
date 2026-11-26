import { useState } from 'react';
import { X } from 'lucide-react';
import { deleteBook, getErrorMessage } from '../api/client';

export default function ConfirmDeleteModal({ book, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!book) return null;

  async function handleConfirm() {
    setDeleting(true);
    setError('');
    try {
      await deleteBook(book._id);
      onDeleted(`Deleted "${book.title}"`);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete book'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Delete Book</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <p style={{ fontSize: '0.94rem' }}>
            Are you sure you want to delete <strong>{book.title}</strong> ({book.bookCode})?
            This will remove the book and its past loan records.
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Book'}
          </button>
        </div>
      </div>
    </div>
  );
}
