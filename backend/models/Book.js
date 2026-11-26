const mongoose = require('mongoose');

const CATEGORIES = [
  'Fiction',
  'Science',
  'History',
  'Technology',
  'Biography',
  'Other'
];

const bookSchema = new mongoose.Schema(
  {
    bookCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: 'Invalid category selected'
      }
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      min: [1, 'Total copies must be at least 1'],
      max: [20, 'Total copies cannot exceed 20']
    },
    availableCopies: {
      type: Number,
      required: true,
      min: [0, 'Available copies cannot be negative'],
      validate: {
        validator: function (val) {
          return val <= this.totalCopies;
        },
        message: 'Available copies cannot exceed total copies'
      }
    }
  },
  {
    timestamps: true
  }
);

const Book = mongoose.model('Book', bookSchema);

module.exports = { Book, CATEGORIES };
