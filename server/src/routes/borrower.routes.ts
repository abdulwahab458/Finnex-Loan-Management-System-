import { Router } from 'express';
import {
  createBorrowerProfile,
  getBorrowerProfile,
  uploadSalarySlip,
  getMyLoan,
} from '../controllers/borrower.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';
import { uploadMiddleware } from '../utils/multer';

const router = Router();

// Protected routes
router.use(authMiddleware);

// Profile routes
router.post('/profile', authorizeRoles('borrower'), createBorrowerProfile);
router.get('/profile', authorizeRoles('borrower'), getBorrowerProfile);

// Upload salary slip
router.post('/upload-salary', authorizeRoles('borrower'), uploadMiddleware.single('salarySlip'), uploadSalarySlip);

// Get own loan
router.get('/my-loan', authorizeRoles('borrower'), getMyLoan);

export default router;
