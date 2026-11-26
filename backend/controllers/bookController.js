const mongoose = require('mongoose');
const { Book, CATEGORIES } = require('../models/Book');
const Counter = require('../models/Counter');
const Loan = require('../models/Loan');
const { getTodayUTC } = require('../utils/dates');
const { sendResponse, normalizeIsbn, isValidIsbn, escapeRegex } = require('../utils/helpers');

async function generateBookCode(category) {
  const prefix = category.slice(0, 3).toUpperCase();
  const counter = await Counter.findOneAndUpdate(
    { _id: prefix },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const seqNum = String(counter.seq).padStart(3, '0');
  return `LB-${prefix}-${seqNum}`;
}

function withOverdueFlag(loanDoc, today) {
  const loan = loanDoc.toObject ? loanDoc.toObject() : { ...loanDoc };
  const isOverdue =
    loan.status === 'Issued' && new Date(loan.dueDate).getTime() < today.getTime();
  return { ...loan, isOverdue };
}

exports.getBooks = async (req, res, next) => {
  try {
    const { category, available, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 5));

    const filter = {};

    if (category && category !== 'All') {
      if (!CATEGORIES.includes(category)) {
        return sendResponse(res, 400, false, 'Invalid category filter');
      }
      filter.category = category;
    }

    if (available === 'true') {
      filter.availableCopies = { $gt: 0 };
    }

    if (search && search.trim()) {
      const pattern = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ title: pattern }, { author: pattern }];
    }

    const totalBooks = await Book.countDocuments(filter);
    const totalPages = Math.ceil(totalBooks / limit);
    const skip = (page - 1) * limit;

    const books = await Book.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return sendResponse(res, 200, true, 'Books fetched successfully', {
      books,
      page,
      limit,
      totalBooks,
      totalPages
    });
  } catch (err) {
    next(err);
  }
};

exports.getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, false, 'Invalid book ID');
    }

    const book = await Book.findById(id);
    if (!book) {
      return sendResponse(res, 404, false, 'Book not found');
    }

    const today = getTodayUTC();
    const rawLoans = await Loan.find({ book: id }).sort({ createdAt: -1 });
    const loans = rawLoans.map((loan) => withOverdueFlag(loan, today));

    return sendResponse(res, 200, true, 'Book details fetched successfully', {
      book,
      loans
    });
  } catch (err) {
    next(err);
  }
};

exports.getBookLoans = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, false, 'Invalid book ID');
    }

    const book = await Book.findById(id);
    if (!book) {
      return sendResponse(res, 404, false, 'Book not found');
    }

    const today = getTodayUTC();
    const rawLoans = await Loan.find({ book: id }).sort({ createdAt: -1 });
    const loans = rawLoans.map((loan) => withOverdueFlag(loan, today));

    return sendResponse(res, 200, true, 'Book loans fetched successfully', loans);
  } catch (err) {
    next(err);
  }
};

exports.createBook = async (req, res, next) => {
  try {
    const { title, author, isbn, category, totalCopies } = req.body;

    if (!title || !String(title).trim()) {
      return sendResponse(res, 400, false, 'Title is required');
    }
    if (!author || !String(author).trim()) {
      return sendResponse(res, 400, false, 'Author is required');
    }
    if (!isbn || !isValidIsbn(String(isbn))) {
      return sendResponse(res, 400, false, 'ISBN must contain exactly 10 or 13 digits');
    }
    if (!category || !CATEGORIES.includes(category)) {
      return sendResponse(res, 400, false, 'Please select a valid category');
    }

    const copies = Number(totalCopies);
    if (!Number.isInteger(copies) || copies < 1 || copies > 20) {
      return sendResponse(res, 400, false, 'Total copies must be an integer between 1 and 20');
    }

    const normalizedIsbn = normalizeIsbn(String(isbn));
    const duplicate = await Book.findOne({ isbn: normalizedIsbn });
    if (duplicate) {
      return sendResponse(res, 409, false, 'A book with this ISBN already exists');
    }

    const bookCode = await generateBookCode(category);

    const book = await Book.create({
      bookCode,
      title: String(title).trim(),
      author: String(author).trim(),
      isbn: normalizedIsbn,
      category,
      totalCopies: copies,
      availableCopies: copies
    });

    return sendResponse(res, 201, true, 'Book added successfully', book);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.isbn) {
      return sendResponse(res, 409, false, 'A book with this ISBN already exists');
    }
    next(err);
  }
};

exports.updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, false, 'Invalid book ID');
    }

    const book = await Book.findById(id);
    if (!book) {
      return sendResponse(res, 404, false, 'Book not found');
    }

    const { title, author, totalCopies } = req.body;

    if (!title || !String(title).trim()) {
      return sendResponse(res, 400, false, 'Title is required');
    }
    if (!author || !String(author).trim()) {
      return sendResponse(res, 400, false, 'Author is required');
    }

    const newTotal = Number(totalCopies);
    if (!Number.isInteger(newTotal) || newTotal < 1 || newTotal > 20) {
      return sendResponse(res, 400, false, 'Total copies must be an integer between 1 and 20');
    }

    const issuedCopies = book.totalCopies - book.availableCopies;
    if (newTotal < issuedCopies) {
      return sendResponse(
        res,
        400,
        false,
        `Total copies cannot be less than currently issued copies (${issuedCopies})`
      );
    }

    book.title = String(title).trim();
    book.author = String(author).trim();
    book.totalCopies = newTotal;
    book.availableCopies = newTotal - issuedCopies;

    await book.save();

    return sendResponse(res, 200, true, 'Book updated successfully', book);
  } catch (err) {
    next(err);
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, false, 'Invalid book ID');
    }

    const book = await Book.findById(id);
    if (!book) {
      return sendResponse(res, 404, false, 'Book not found');
    }

    const activeLoanExists = await Loan.exists({ book: id, status: 'Issued' });
    if (activeLoanExists || book.availableCopies < book.totalCopies) {
      return sendResponse(res, 400, false, 'Cannot delete a book that has unreturned copies');
    }

    await Loan.deleteMany({ book: id });
    await Book.findByIdAndDelete(id);

    return sendResponse(res, 200, true, 'Book deleted successfully', null);
  } catch (err) {
    next(err);
  }
};
