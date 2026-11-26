const express = require('express');
const {
  getBooks,
  getBookById,
  getBookLoans,
  createBook,
  updateBook,
  deleteBook
} = require('../controllers/bookController');

const router = express.Router();

router.get('/', getBooks);
router.post('/', createBook);
router.get('/:id', getBookById);
router.get('/:id/loans', getBookLoans);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

module.exports = router;
