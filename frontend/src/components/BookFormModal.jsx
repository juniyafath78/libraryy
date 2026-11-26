import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CATEGORIES, isValidIsbnInput } from '../utils/formatters';
import { createBook, updateBook, getErrorMessage } from '../api/client';

export default function BookFormModal({ isOpen, book, onClose, onSaved }) {
  const isEdit = Boolean(book);
  const issuedCopies = isEdit ? book.totalCopies - book.availableCopies : 0;

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [totalCopies, setTotalCopies] = useState('1');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (book) {
      setTitle(book.title || '');
      setAuthor(book.author || '');
      setIsbn(book.isbn || '');
      setCategory(book.category || CATEGORIES[0]);
      setTotalCopies(String(book.totalCopies ?? 1));
    } else {
      setTitle('');
      setAuthor('');
      setIsbn('');
      setCategory(CATEGORIES[0]);
      setTotalCopies('1');
    }
    setFieldErrors({});
    setServerError('');
  }, [isOpen, book]);

  if (!isOpen) return null;

  function validate() {
    const errors = {};

    if (!title.trim()) {
      errors.title = 'Title is required';
    }
    if (!author.trim()) {
      errors.author = 'Author is required';
    }
    if (!isEdit) {
      if (!isbn.trim()) {
        errors.isbn = 'ISBN is required';
      } else if (!isValidIsbnInput(isbn)) {
        errors.isbn = 'ISBN must contain exactly 10 or 13 digits';
      }
      if (!CATEGORIES.includes(category)) {
        errors.category = 'Please select a valid category';
      }
    }

    const parsedCopies = Number(totalCopies);
    if (!totalCopies || !Number.isInteger(parsedCopies) || parsedCopies < 1 || parsedCopies > 20) {
      errors.totalCopies = 'Total copies must be a whole number between 1 and 20';
    } else if (isEdit && parsedCopies < issuedCopies) {
      errors.totalCopies = `Cannot be less than currently issued copies (${issuedCopies})`;
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
      if (isEdit) {
        await updateBook(book._id, {
          title: title.trim(),
          author: author.trim(),
          totalCopies: Number(totalCopies)
        });
        onSaved('Book updated successfully');
      } else {
        await createBook({
          title: title.trim(),
          author: author.trim(),
          isbn: isbn.trim(),
          category,
          totalCopies: Number(totalCopies)
        });
        onSaved('Book added successfully');
      }
      onClose();
    } catch (err) {
      setServerError(getErrorMessage(err, 'Unable to save book'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Book' : 'Add New Book'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {serverError && <div className="alert alert-error">{serverError}</div>}

            <div className="form-grid">
              {isEdit && (
                <div>
                  <label className="field-label">Book Code</label>
                  <input className="input" type="text" value={book.bookCode} disabled />
                </div>
              )}

              <div>
                <label className="field-label" htmlFor="book-title">
                  Title
                </label>
                <input
                  id="book-title"
                  className="input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Clean Code"
                />
                {fieldErrors.title && <div className="field-error">{fieldErrors.title}</div>}
              </div>

              <div>
                <label className="field-label" htmlFor="book-author">
                  Author
                </label>
                <input
                  id="book-author"
                  className="input"
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Robert C. Martin"
                />
                {fieldErrors.author && <div className="field-error">{fieldErrors.author}</div>}
              </div>

              <div className="form-row-2">
                <div>
                  <label className="field-label" htmlFor="book-isbn">
                    ISBN
                  </label>
                  <input
                    id="book-isbn"
                    className="input"
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    disabled={isEdit}
                    placeholder="10 or 13 digits"
                  />
                  {fieldErrors.isbn && <div className="field-error">{fieldErrors.isbn}</div>}
                </div>

                <div>
                  <label className="field-label" htmlFor="book-category">
                    Category
                  </label>
                  <select
                    id="book-category"
                    className="select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isEdit}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.category && (
                    <div className="field-error">{fieldErrors.category}</div>
                  )}
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="book-copies">
                  Total Copies
                </label>
                <input
                  id="book-copies"
                  className="input"
                  type="number"
                  min="1"
                  max="20"
                  value={totalCopies}
                  onChange={(e) => setTotalCopies(e.target.value)}
                />
                {fieldErrors.totalCopies ? (
                  <div className="field-error">{fieldErrors.totalCopies}</div>
                ) : (
                  <div className="field-hint">
                    {isEdit
                      ? `Allowed range: ${Math.max(1, issuedCopies)} to 20 (${issuedCopies} currently issued)`
                      : 'Must be between 1 and 20. Book code is auto-generated.'}
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
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
