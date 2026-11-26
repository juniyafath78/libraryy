const express = require('express');
const { issueBook, returnBook } = require('../controllers/loanController');

const router = express.Router();

router.post('/', issueBook);
router.patch('/:id/return', returnBook);

module.exports = router;
