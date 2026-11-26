const mongoose = require('mongoose');
const { Book } = require('../models/Book');
const Loan = require('../models/Loan');
const { getTodayUTC, parseDateOnly, addDaysUTC, getDaysDiff } = require('../utils/dates');
const { sendResponse } = require('../utils/helpers');

const FINE_PER_DAY = 5;
const LOAN_DAYS = 14;

exports.issueBook = async (req, res, next) => {
  let decrementedBookId = null;

  try {
    const { bookId, memberName, memberId, issueDate } = req.body;

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return sendResponse(res, 400, false, 'Valid book ID is required');
    }
    if (!memberName || !String(memberName).trim()) {
      return sendResponse(res, 400, false, 'Member name is required');
    }
    if (!memberId || !String(memberId).trim()) {
      return sendResponse(res, 400, false, 'Member ID is required');
    }

    const today = getTodayUTC();
    const parsedIssueDate = issueDate ? parseDateOnly(String(issueDate)) : today;
    if (!parsedIssueDate) {
      return sendResponse(res, 400, false, 'Invalid issue date');
    }
    if (parsedIssueDate.getTime() > today.getTime()) {
      return sendResponse(res, 400, false, 'Issue date cannot be in the future');
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return sendResponse(res, 404, false, 'Book not found');
    }

    if (book.availableCopies <= 0) {
      return sendResponse(res, 400, false, 'No copies of this book are currently available');
    }

    const cleanMemberId = String(memberId).trim();
    const existingActiveLoan = await Loan.findOne({
      book: bookId,
      memberId: cleanMemberId,
      status: 'Issued'
    });

    if (existingActiveLoan) {
      return sendResponse(
        res,
        409,
        false,
        'This member already holds an unreturned copy of this book'
      );
    }

    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );

    if (!updatedBook) {
      return sendResponse(res, 400, false, 'No copies of this book are currently available');
    }
    decrementedBookId = bookId;

    const dueDate = addDaysUTC(parsedIssueDate, LOAN_DAYS);

    const loan = await Loan.create({
      book: bookId,
      memberName: String(memberName).trim(),
      memberId: cleanMemberId,
      issueDate: parsedIssueDate,
      dueDate,
      returnDate: null,
      fine: 0,
      status: 'Issued'
    });

    const isOverdue = dueDate.getTime() < today.getTime();
    return sendResponse(res, 201, true, 'Book issued successfully', {
      ...loan.toObject(),
      isOverdue
    });
  } catch (err) {
    if (decrementedBookId) {
      await Book.findByIdAndUpdate(decrementedBookId, { $inc: { availableCopies: 1 } }).catch(() => {});
    }
    next(err);
  }
};

exports.returnBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(res, 400, false, 'Invalid loan ID');
    }

    const loan = await Loan.findById(id);
    if (!loan) {
      return sendResponse(res, 404, false, 'Loan record not found');
    }

    if (loan.status === 'Returned' || loan.returnDate !== null) {
      return sendResponse(res, 400, false, 'This loan has already been returned');
    }

    const returnDate = getTodayUTC();
    const overdueDays = getDaysDiff(returnDate, new Date(loan.dueDate));
    const fine = overdueDays > 0 ? overdueDays * FINE_PER_DAY : 0;

    const updatedLoan = await Loan.findOneAndUpdate(
      { _id: id, status: 'Issued' },
      {
        $set: {
          returnDate,
          fine,
          status: 'Returned'
        }
      },
      { new: true }
    );

    if (!updatedLoan) {
      return sendResponse(res, 400, false, 'This loan has already been returned');
    }

    await Book.findOneAndUpdate(
      {
        _id: loan.book,
        $expr: { $lt: ['$availableCopies', '$totalCopies'] }
      },
      { $inc: { availableCopies: 1 } }
    );

    return sendResponse(res, 200, true, 'Book returned successfully', {
      ...updatedLoan.toObject(),
      isOverdue: false
    });
  } catch (err) {
    next(err);
  }
};
