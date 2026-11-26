const { Book } = require('../models/Book');
const Loan = require('../models/Loan');
const { getTodayUTC } = require('../utils/dates');
const { sendResponse } = require('../utils/helpers');

exports.getStats = async (req, res, next) => {
  try {
    const today = getTodayUTC();

    const [bookSummary] = await Book.aggregate([
      {
        $group: {
          _id: null,
          totalTitles: { $sum: 1 },
          totalCopies: { $sum: '$totalCopies' },
          availableCopies: { $sum: '$availableCopies' }
        }
      }
    ]);

    const [overdueLoans, fineSummary] = await Promise.all([
      Loan.countDocuments({ status: 'Issued', dueDate: { $lt: today } }),
      Loan.aggregate([
        { $match: { status: 'Returned' } },
        { $group: { _id: null, totalFine: { $sum: '$fine' } } }
      ])
    ]);

    const totalTitles = bookSummary ? bookSummary.totalTitles : 0;
    const totalCopies = bookSummary ? bookSummary.totalCopies : 0;
    const issuedCopies = bookSummary
      ? bookSummary.totalCopies - bookSummary.availableCopies
      : 0;
    const totalFineCollected =
      fineSummary.length > 0 ? fineSummary[0].totalFine : 0;

    return sendResponse(res, 200, true, 'Statistics fetched successfully', {
      totalTitles,
      totalCopies,
      issuedCopies,
      overdueLoans,
      totalFineCollected
    });
  } catch (err) {
    next(err);
  }
};
