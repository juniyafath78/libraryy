import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, BookUp, Eye } from 'lucide-react';
import { fetchBooks, getErrorMessage } from '../api/client';
import { CATEGORIES } from '../utils/formatters';
import BookFormModal from '../components/BookFormModal';
import IssueBookModal from '../components/IssueBookModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function BooksPage({ onDataChange }) {
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [issuingBook, setIssuingBook] = useState(null);
  const [deletingBook, setDeletingBook] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearchTerm(searchInput.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchBooks({
        page,
        limit: 5,
        category: category !== 'All' ? category : undefined,
        available: availableOnly ? 'true' : undefined,
        search: searchTerm || undefined
      });
      setBooks(data.books);
      setTotalPages(data.totalPages);
      setTotalBooks(data.totalBooks);
      if (data.totalPages > 0 && page > data.totalPages) {
        setPage(data.totalPages);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load books'));
    } finally {
      setLoading(false);
    }
  }, [page, category, availableOnly, searchTerm]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  function handleMutationSuccess(message) {
    setNotice(message);
    loadBooks();
    onDataChange();
  }

  function openAddModal() {
    setEditingBook(null);
    setFormModalOpen(true);
  }

  function openEditModal(book) {
    setEditingBook(book);
    setFormModalOpen(true);
  }

  return (
    <div>
      {notice && (
        <div className="alert alert-success">
          <span>{notice}</span>
          <button type="button" className="icon-btn" onClick={() => setNotice('')}>
            ✕
          </button>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel">
        <div className="toolbar">
          <div className="filters-group">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                className="input"
                placeholder="Search by title or author..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <select
              className="select category-select"
              aria-label="Filter by category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <label className="checkbox-filter">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => {
                  setAvailableOnly(e.target.checked);
                  setPage(1);
                }}
              />
              Available only
            </label>
          </div>

          <button type="button" className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Add Book
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Loading books...</div>
        ) : books.length === 0 ? (
          <div className="empty-state">
            No books matched your filters. Try adjusting your search or add a new book.
          </div>
        ) : (
          <>
            <div className="table-wrap desktop-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Book Code</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th>Available / Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => {
                    const hasActiveLoans = book.availableCopies < book.totalCopies;
                    const noneAvailable = book.availableCopies === 0;

                    return (
                      <tr key={book._id}>
                        <td>
                          <span className="code-pill">{book.bookCode}</span>
                        </td>
                        <td>
                          <Link className="book-link" to={`/books/${book._id}`}>
                            {book.title}
                          </Link>
                          <div className="sub-text">ISBN: {book.isbn}</div>
                        </td>
                        <td>{book.author}</td>
                        <td>
                          <span className="category-tag">{book.category}</span>
                        </td>
                        <td>
                          <span
                            className={`copies-text ${noneAvailable ? 'copies-zero' : ''}`}
                          >
                            {book.availableCopies} / {book.totalCopies}
                          </span>
                        </td>
                        <td>
                          <div className="actions-row">
                            <Link
                              to={`/books/${book._id}`}
                              className="btn btn-secondary btn-sm"
                              title="View loan history"
                            >
                              <Eye size={14} />
                              Loans
                            </Link>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={noneAvailable}
                              onClick={() => setIssuingBook(book)}
                              title={
                                noneAvailable
                                  ? 'No copies available to issue'
                                  : 'Issue this book'
                              }
                            >
                              <BookUp size={14} />
                              Issue
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditModal(book)}
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              disabled={hasActiveLoans}
                              onClick={() => setDeletingBook(book)}
                              title={
                                hasActiveLoans
                                  ? 'Cannot delete while copies are issued'
                                  : 'Delete book'
                              }
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mobile-cards">
              {books.map((book) => {
                const hasActiveLoans = book.availableCopies < book.totalCopies;
                const noneAvailable = book.availableCopies === 0;

                return (
                  <div className="mobile-card" key={book._id}>
                    <div className="mobile-card-top">
                      <div>
                        <span className="code-pill">{book.bookCode}</span>
                        <div style={{ marginTop: '0.35rem' }}>
                          <Link className="book-link" to={`/books/${book._id}`}>
                            {book.title}
                          </Link>
                        </div>
                      </div>
                      <span
                        className={`copies-text ${noneAvailable ? 'copies-zero' : ''}`}
                      >
                        {book.availableCopies} / {book.totalCopies}
                      </span>
                    </div>

                    <div className="mobile-card-meta">
                      <span>{book.author}</span>
                      <span>•</span>
                      <span>{book.category}</span>
                      <span>•</span>
                      <span>ISBN: {book.isbn}</span>
                    </div>

                    <div className="actions-row">
                      <Link
                        to={`/books/${book._id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye size={14} />
                        Loans
                      </Link>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={noneAvailable}
                        onClick={() => setIssuingBook(book)}
                      >
                        <BookUp size={14} />
                        Issue
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(book)}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        disabled={hasActiveLoans}
                        onClick={() => setDeletingBook(book)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="pagination">
          <span>
            Showing page {totalPages === 0 ? 0 : page} of {totalPages} ({totalBooks} total)
          </span>
          <div className="page-controls">
            <button
              type="button"
              className="page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
              <button
                key={num}
                type="button"
                className={`page-btn ${num === page ? 'active' : ''}`}
                onClick={() => setPage(num)}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              className="page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <BookFormModal
        isOpen={formModalOpen}
        book={editingBook}
        onClose={() => setFormModalOpen(false)}
        onSaved={handleMutationSuccess}
      />

      <IssueBookModal
        isOpen={Boolean(issuingBook)}
        book={issuingBook}
        onClose={() => setIssuingBook(null)}
        onIssued={handleMutationSuccess}
      />

      <ConfirmDeleteModal
        book={deletingBook}
        onClose={() => setDeletingBook(null)}
        onDeleted={handleMutationSuccess}
      />
    </div>
  );
}
