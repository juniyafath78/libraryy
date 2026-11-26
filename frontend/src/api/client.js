import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
});

export function getErrorMessage(err, fallback = 'Something went wrong') {
  return err?.response?.data?.message || err?.message || fallback;
}

export async function fetchStats() {
  const res = await api.get('/stats');
  return res.data.data;
}

export async function fetchBooks(params) {
  const res = await api.get('/books', { params });
  return res.data.data;
}

export async function fetchBookDetails(id) {
  const res = await api.get(`/books/${id}`);
  return res.data.data;
}

export async function createBook(payload) {
  const res = await api.post('/books', payload);
  return res.data;
}

export async function updateBook(id, payload) {
  const res = await api.put(`/books/${id}`, payload);
  return res.data;
}

export async function deleteBook(id) {
  const res = await api.delete(`/books/${id}`);
  return res.data;
}

export async function issueBook(payload) {
  const res = await api.post('/loans', payload);
  return res.data;
}

export async function returnBook(loanId) {
  const res = await api.patch(`/loans/${loanId}/return`);
  return res.data;
}
