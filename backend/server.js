require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const bookRoutes = require('./routes/bookRoutes');
const loanRoutes = require('./routes/loanRoutes');
const statsRoutes = require('./routes/statsRoutes');
const { sendResponse } = require('./utils/helpers');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173'
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  sendResponse(res, 200, true, 'Library Lending API is running', { status: 'ok' });
});

app.use('/api/books', bookRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/stats', statsRoutes);

app.use((req, res) => {
  sendResponse(res, 404, false, 'Route not found');
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ValidationError') {
    const firstMsg = Object.values(err.errors)[0]?.message || 'Validation failed';
    return sendResponse(res, 400, false, firstMsg);
  }
  sendResponse(res, 500, false, 'Internal server error');
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
