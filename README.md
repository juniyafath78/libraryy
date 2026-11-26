# Library Book Lending Manager

A MERN stack web application for managing a library's book inventory, issuing copies to members, tracking returns, and calculating late fines.

## Project Structure

```text
library-book-lending-manager/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env
│   ├── package.json
│   ├── seed.js
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── screenshots/
│   ├── dashboard.png
│   └── book-details.png
└── README.md
```

## Setup & Running Locally

### 1. Backend
```bash
cd backend
npm install
npm run seed   # Optional: loads sample books and loans
npm run dev
```

Backend environment variables (`backend/.env`):
- `PORT=5000`
- `MONGO_URI=<your MongoDB Atlas connection string>`
- `CLIENT_URL=http://localhost:5173`

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend environment variables (`frontend/.env`):
- `VITE_API_BASE_URL=http://localhost:5000/api`

Open `http://localhost:5173` in your browser.

---

## API Endpoints

All endpoints return JSON in the format:
```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

### Books
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/books` | List books with pagination (`limit=5` default). Supports `category`, `available=true`, `search` (title or author), and `page` query params. Returns `{ books, page, limit, totalBooks, totalPages }`. |
| `GET` | `/api/books/:id` | Fetch single book details along with its loan history (each loan includes `isOverdue`). |
| `GET` | `/api/books/:id/loans` | Fetch only the loan history for a specific book. |
| `POST` | `/api/books` | Add a new book. Validates 10 or 13 digit ISBN, category enum, and total copies (`1–20`). Auto-generates `LB-<CAT>-<SEQ>` book code and rejects duplicate ISBNs with `409`. |
| `PUT` | `/api/books/:id` | Update `title`, `author`, and `totalCopies`. `bookCode`, `isbn`, and `category` cannot be modified. Rejects reducing `totalCopies` below currently issued copies and recalculates `availableCopies`. |
| `DELETE` | `/api/books/:id` | Delete a book. Returns `400` if any copy is currently issued (unreturned). |

### Loans
| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/loans` | Issue a book (`bookId`, `memberName`, `memberId`, `issueDate`). Rejects future dates, unavailable books, and duplicate active loans for the same `memberId` (`409`). Sets `dueDate` to 14 days after `issueDate` and decrements `availableCopies`. |
| `PATCH` | `/api/loans/:id/return` | Return an active loan. Stores today's date as `returnDate`, calculates fine at ₹5/day after `dueDate`, increments `availableCopies`, and rejects already-returned loans (`400`). |

### Statistics
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/stats` | Returns `totalTitles`, `totalCopies`, `issuedCopies`, `overdueLoans`, and `totalFineCollected`. |

---

## Screenshots

### 1. Book Collection & Live Statistics Dashboard
![Library Dashboard](screenshots/dashboard.png)

### 2. Book Details & Loan History
![Book Details and Loan History](screenshots/book-details.png)
