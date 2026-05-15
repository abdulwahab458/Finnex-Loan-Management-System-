import { Router } from 'express';
import {
  applyLoan,
  approveLoan,
  disburseLoan,
  recordPayment,
  getPayments,
} from '../controllers/loan.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';

const router = Router();

// Protected routes
router.use(authMiddleware);

// Borrower - Apply for loan
router.post('/apply', authorizeRoles('borrower'), applyLoan);

// Sanction officer - Approve or reject loan
router.patch('/:loanId/sanction', authorizeRoles('sanction', 'admin'), approveLoan);

// Disbursement officer - Disburse loan
router.patch('/:loanId/disburse', authorizeRoles('disbursement', 'admin'), disburseLoan);

// Collection officer - Record payments
router.post('/:loanId/payments', authorizeRoles('collection', 'admin'), recordPayment);
router.get('/:loanId/payments', authorizeRoles('collection', 'admin'), getPayments);

export default router;
