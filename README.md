# Finnex

A complete full-stack lending platform with separate portals for borrowers and operations teams.

## 📋 Project Overview

Finnex is a comprehensive platform that enables:
- **Borrowers**: Multi-step loan application process with automated validation
- **Operations Team**: Role-based dashboards for sales tracking, loan sanction, disbursement, and collection

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | Node.js + Express.js + TypeScript |
| Database | MongoDB with Mongoose |
| Authentication | JWT + bcrypt |

## 📁 Project Structure

```
lms/
├── client/                    # Next.js Frontend
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── borrower/
│   │   │   ├── personal-details/
│   │   │   ├── upload-salary/
│   │   │   └── loan-config/
│   │   └── dashboard/
│   │       ├── sales/
│   │       ├── sanction/
│   │       ├── disbursement/
│   │       └── collection/
│   ├── components/
│   ├── lib/
│   ├── types/
│   ├── middleware.ts
│   └── package.json
│
├── server/                    # Express Backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── seeds/
│   │   └── index.ts
│   ├── uploads/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── .env.example
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js v18+ 
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

#### 1. Clone and Navigate
```bash
cd lms
```

#### 2. Backend Setup
```bash
cd server

# Install dependencies
npm install

# Create .env file (already provided with MongoDB URI)
# Copy .env.example to .env if needed
cp .env.example .env

# Run database seed (creates test users)
npm run seed

# Start development server
npm run dev
```

Server will run on `http://localhost:5000`

#### 3. Frontend Setup (New Terminal)
```bash
cd ../client

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## 🔐 Login Credentials

After running the seed script, use these credentials:

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@lms.com | Admin@123 |
| **Sales** | sales@lms.com | Sales@123 |
| **Sanction Officer** | sanction@lms.com | Sanction@123 |
| **Disbursement Officer** | disburse@lms.com | Disburse@123 |
| **Collection Agent** | collection@lms.com | Collection@123 |
| **Test Borrower** | borrower@lms.com | Borrower@123 |

## 📚 API Documentation

### Authentication Endpoints
```
POST   /api/auth/signup           # Register new borrower
POST   /api/auth/login            # Login
```

### Borrower Endpoints
```
POST   /api/borrower/profile      # Submit personal details (with BRE validation)
GET    /api/borrower/profile      # Get own profile
POST   /api/borrower/upload-salary # Upload salary slip
GET    /api/loans/my-loan         # Get own loan status
```

### Loan Endpoints
```
POST   /api/loans/apply           # Apply for loan
PATCH  /api/loans/:loanId/sanction # Approve/Reject loan
PATCH  /api/loans/:loanId/disburse # Mark as disbursed
POST   /api/loans/:loanId/payments # Record payment
GET    /api/loans/:loanId/payments # Get payment history
```

### Dashboard Endpoints
```
GET    /api/dashboard/sales/leads        # Sales module - leads tracking
GET    /api/dashboard/sanction/loans     # Sanction module - pending loans
GET    /api/dashboard/disbursement/loans # Disbursement module - sanctioned loans
GET    /api/dashboard/collection/loans   # Collection module - disbursed loans
GET    /api/admin/users                  # Admin - all users
```

## 🎯 Key Features

### Borrower Portal
1. **Sign Up / Login** - Secure authentication with JWT
2. **Personal Details** - Profile creation with Business Rule Engine (BRE) validation:
   - Age: 23-50 years
   - Monthly Salary: ≥ ₹25,000
   - PAN Format: Valid Indian PAN
   - Employment: Must not be unemployed

3. **Salary Slip Upload** - PDF/JPG/PNG (max 5MB)
4. **Loan Configuration** - Interactive sliders with live SI calculation:
   - Loan Amount: ₹50,000 - ₹5,00,000
   - Tenure: 30 - 365 days
   - Interest Rate: 12% p.a. (fixed)
   - Simple Interest = (P × R × T) / (365 × 100)

### Operations Dashboard

#### Sales Module
- Track all borrowers and their application status
- Lead management view

#### Sanction Module
- Review loan applications
- Approve or reject with reason
- View borrower details and salary slip

#### Disbursement Module
- Mark sanctioned loans as disbursed
- Track disbursement status

#### Collection Module
- Record repayments with UTR numbers
- Track outstanding balance
- Auto-close loans when fully paid
- Payment history

## 🔄 Loan State Machine

```
[APPLIED] 
    ├──(approve)──→ [SANCTIONED]
    │                    ├──(disburse)──→ [DISBURSED]
    │                    │                    ├──(full payment)──→ [CLOSED]
    │                    │                    └──(record payments)
    │                    │
    └──(reject)──→ [REJECTED]
```

## 🔒 Security Features

- **JWT Authentication** - Token-based auth with expiry
- **bcrypt Password Hashing** - Secure password storage (10 salt rounds)
- **RBAC Middleware** - Role-based access control on all protected routes
- **Server-Side BRE** - Business rules enforced server-side only
- **File Upload Validation** - Type and size validation for salary slips
- **UTR Uniqueness** - Prevents duplicate payment entries

## 📊 Database Models

### Users
```typescript
{
  fullName, email, passwordHash, 
  role: ['admin', 'sales', 'sanction', 'disbursement', 'collection', 'borrower']
}
```

### Borrower Profiles
```typescript
{
  userId, fullName, pan, dateOfBirth, monthlySalary, 
  employmentMode: ['salaried', 'self-employed', 'unemployed'],
  breStatus: ['passed', 'failed', 'pending'],
  breFailureReasons: []
}
```

### Loans
```typescript
{
  borrowerId, profileId, salarySlipUrl, salarySlipOriginalName,
  loanAmount, tenure, interestRate, simpleInterest, totalRepayment,
  status: ['applied', 'sanctioned', 'rejected', 'disbursed', 'closed'],
  sanctionedBy, sanctionedAt, disbursedBy, disbursedAt, closedAt
}
```

### Payments
```typescript
{
  loanId, utrNumber (unique), amount, paymentDate, recordedBy
}
```

## 🌐 Environment Variables

### Server (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
NODE_ENV=development
```

### Client (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📝 Available NPM Scripts

### Server
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build TypeScript
npm run start        # Start production server
npm run seed         # Run database seed script
npm run type-check   # Check TypeScript errors
```

### Client
```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🧪 Testing the Application

### Complete Borrower Flow
1. Signup at `/signup`
2. Fill personal details (BRE validation runs)
3. Upload salary slip
4. Configure and apply for loan
5. Check loan status in `/borrower/personal-details`

### Operations Workflow
1. Login as Sales Officer → View leads
2. Login as Sanction Officer → Approve/Reject loans
3. Login as Disbursement Officer → Disburse sanctioned loans
4. Login as Collection Officer → Record payments

## 🐛 Troubleshooting

### Port 5000 already in use
```bash
# Find process using port 5000
netstat -ano | findstr :5000
# Kill the process
taskkill /PID <PID> /F
```

### MongoDB Connection Error
- Verify MongoDB URI in `.env`
- Check MongoDB Atlas network access
- Ensure IP is whitelisted

### CORS Issues
- Frontend and backend must be on different ports
- CORS is enabled in Express for localhost

### Seed Script Fails
```bash
# Ensure MongoDB is connected
# Try running seed again
npm run seed
```

## 📦 Deployment

### Backend (Heroku/Railway)
```bash
# Build
npm run build

# Start
npm run start
```

### Frontend (Vercel)
```bash
# Vercel auto-detects Next.js
# Set NEXT_PUBLIC_API_URL in deployment env vars
```

## 📞 Support

For issues or questions, check:
- Backend logs: `npm run dev` output
- Frontend console: Browser DevTools
- MongoDB Atlas dashboard for connection issues

## 📄 License

This project is for educational purposes.

---

**Built with ❤️ - Full-Stack Loan Management System**
