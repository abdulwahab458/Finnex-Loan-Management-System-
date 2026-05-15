import { Router } from 'express';
import {
  getSalesLeads,
  getSanctionLoans,
  getDisbursementLoans,
  getCollectionLoans,
  getAllUsers,
} from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';

const router = Router();

// Protected routes
router.use(authMiddleware);

// Sales module
router.get('/sales/leads', authorizeRoles('sales', 'admin'), getSalesLeads);

// Sanction module
router.get('/sanction/loans', authorizeRoles('sanction', 'admin'), getSanctionLoans);

// Disbursement module
router.get('/disbursement/loans', authorizeRoles('disbursement', 'admin'), getDisbursementLoans);

// Collection module
router.get('/collection/loans', authorizeRoles('collection', 'admin'), getCollectionLoans);

// Admin module
router.get('/admin/users', authorizeRoles('admin'), getAllUsers);

export default router;
