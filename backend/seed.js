require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { Book } = require('./models/Book');
const Counter = require('./models/Counter');
const Loan = require('./models/Loan');
const { getTodayUTC, addDaysUTC } = require('./utils/dates');

const SAMPLE_BOOKS = [
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '9780132350884',
    category: 'Technology',
    totalCopies: 5
  },
  {
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    isbn: '9781449373320',
    category: 'Technology',
    totalCopies: 3
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'David Thomas',
    isbn: '9780135957059',
    category: 'Technology',
    totalCopies: 2
  },
  {
    title: '1984',
    author: 'George Orwell',
    isbn: '9780451524935',
    category: 'Fiction',
    totalCopies: 4
  },
  {
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    isbn: '9780553380163',
    category: 'Science',
    totalCopies: 3
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    isbn: '9780062316097',
    category: 'History',
    totalCopies: 4
  },
  {
    title: 'Steve Jobs',
    author: 'Walter Isaacson',
    isbn: '9781451648539',
    category: 'Biography',
    totalCopies: 2
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '9780735211292',
    category: 'Other',
    totalCopies: 1
  }
];

async function runSeed() {
  await connectDB();

  await Loan.deleteMany({});
  await Book.deleteMany({});
  await Counter.deleteMany({});

  const createdBooks = [];
  for (const item of SAMPLE_BOOKS) {
    const prefix = item.category.slice(0, 3).toUpperCase();
    const counter = await Counter.findOneAndUpdate(
      { _id: prefix },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const bookCode = `LB-${prefix}-${String(counter.seq).padStart(3, '0')}`;
    const doc = await Book.create({
      ...item,
      bookCode,
      availableCopies: item.totalCopies
    });
    createdBooks.push(doc);
  }

  const today = getTodayUTC();

  // Overdue loan (issued 20 days ago, due 6 days ago)
  const cleanCode = createdBooks[0];
  await Loan.create({
    book: cleanCode._id,
    memberName: 'Aarav Nair',
    memberId: 'MEM-101',
    issueDate: addDaysUTC(today, -20),
    dueDate: addDaysUTC(today, -6),
    returnDate: null,
    fine: 0,
    status: 'Issued'
  });

  // Active loan (not overdue)
  await Loan.create({
    book: cleanCode._id,
    memberName: 'Meera Krishnan',
    memberId: 'MEM-104',
    issueDate: addDaysUTC(today, -3),
    dueDate: addDaysUTC(today, 11),
    returnDate: null,
    fine: 0,
    status: 'Issued'
  });

  // Returned loan with ₹15 fine (3 days late)
  await Loan.create({
    book: cleanCode._id,
    memberName: 'Rohan Verma',
    memberId: 'MEM-109',
    issueDate: addDaysUTC(today, -21),
    dueDate: addDaysUTC(today, -7),
    returnDate: addDaysUTC(today, -4),
    fine: 15,
    status: 'Returned'
  });

  cleanCode.availableCopies = cleanCode.totalCopies - 2;
  await cleanCode.save();

  // Fully checked-out book (0 available)
  const atomicHabits = createdBooks[7];
  await Loan.create({
    book: atomicHabits._id,
    memberName: 'Sneha Patel',
    memberId: 'MEM-112',
    issueDate: addDaysUTC(today, -17),
    dueDate: addDaysUTC(today, -3),
    returnDate: null,
    fine: 0,
    status: 'Issued'
  });
  atomicHabits.availableCopies = 0;
  await atomicHabits.save();

  console.log(`Seeded ${createdBooks.length} books and sample loans.`);
  await mongoose.disconnect();
}

runSeed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
