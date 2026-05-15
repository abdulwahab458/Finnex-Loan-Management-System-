import { Response } from 'express';
import { User, Loan, BorrowerProfile, Payment } from '../models';
import { AuthRequest } from '../middlewares/auth.middleware';

// SALES MODULE
export const getSalesLeads = async (req: AuthRequest, res: Response) => {
  try {
    // Get all borrowers
    const borrowers = await User.find({ role: 'borrower' }).select('-passwordHash');

    // Enrich with profile status
    const leads = await Promise.all(
      borrowers.map(async (borrower: any) => {
        const profile = await BorrowerProfile.findOne({ userId: borrower._id });
        const loan = await Loan.findOne({ borrowerId: borrower._id });

        let profileStatus = 'No Profile';
        if (profile?.breStatus === 'failed') {
          profileStatus = 'BRE Failed';
        } else if (profile?.breStatus === 'passed' && !loan) {
          profileStatus = 'BRE Passed';
        } else if (loan) {
          profileStatus = 'Applied';
        }

        return {
          _id: borrower._id,
          fullName: borrower.fullName,
          email: borrower.email,
          signupDate: borrower.createdAt,
          profileStatus,
        };
      })
    );

    res.status(200).json({ leads });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Error fetching leads' });
  }
};

// SANCTION MODULE
export const getSanctionLoans = async (req: AuthRequest, res: Response) => {
  try {
    const loans = await Loan.find({ status: 'applied' })
      .populate('borrowerId', 'fullName email')
      .populate('profileId', 'pan monthlySalary')
      .sort({ createdAt: -1 });

    res.status(200).json({ loans });
  } catch (error) {
    console.error('Get sanction loans error:', error);
    res.status(500).json({ error: 'Error fetching loans' });
  }
};

// DISBURSEMENT MODULE
export const getDisbursementLoans = async (req: AuthRequest, res: Response) => {
  try {
    const { tab, search, startDate, endDate } = req.query as any;
    const searchText = String(search || '').trim();

    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\\$&`);

    // Build base filters
    const pendingFilter: any = { status: 'sanctioned' };
    const historyFilter: any = { status: { $in: ['disbursed', 'closed'] } };

    // Apply search (loan id or borrower name) handled later in-memory

    // Date range filter applies to sanctionedAt for pending, and disbursedAt for history
    const dateFilter: any = {};
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date('1970-01-01');
      const end = endDate ? new Date(endDate) : new Date();
      // make end inclusive
      end.setHours(23, 59, 59, 999);
      dateFilter.range = { start, end };
    }

    // Helper to apply population and mapping
    const populateAndFilter = async (mongoFilter: any, dateField: string) => {
      const finalFilter: any = { ...mongoFilter };
      if (dateFilter.range) {
        finalFilter[dateField] = { $gte: dateFilter.range.start, $lte: dateFilter.range.end };
      }

      let loans = await Loan.find(finalFilter)
        .populate('borrowerId', 'fullName email')
        .populate('profileId', 'pan monthlySalary employmentMode salarySlipUrl salarySlipOriginalName')
        .populate('sanctionedBy', 'fullName email')
        .populate('disbursedBy', 'fullName email')
        .sort({ [dateField]: -1 });

      if (searchText) {
        const regex = new RegExp(escapeRegExp(searchText), 'i');
        loans = loans.filter((l: any) => regex.test(l.borrowerId?.fullName || '') || regex.test(String(l._id)));
      }

      return loans;
    };

    // Determine which set to return
    const tabName = tab === 'history' ? 'history' : 'pending';
    const loans = await (tabName === 'history' ? populateAndFilter(historyFilter, 'disbursedAt') : populateAndFilter(pendingFilter, 'sanctionedAt'));

    // Summary metrics
    const totalLoansPending = await Loan.countDocuments({ status: 'sanctioned' });

    // Total amount to be disbursed today: sanctioned today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todaysSanctioned = await Loan.find({ status: 'sanctioned', sanctionedAt: { $gte: todayStart, $lte: todayEnd } });
    const totalAmountToDisburseToday = todaysSanctioned.reduce((s: number, l: any) => s + (l.loanAmount || 0), 0);

    // Disbursed this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const disbursedThisMonth = await Loan.find({ status: { $in: ['disbursed', 'closed'] }, disbursedAt: { $gte: monthStart, $lte: monthEnd } });
    const totalLoansDisbursedThisMonth = disbursedThisMonth.length;
    const totalAmountDisbursedThisMonth = disbursedThisMonth.reduce((s: number, l: any) => s + (l.loanAmount || 0), 0);

    res.status(200).json({
      loans,
      summary: {
        totalLoansPending,
        totalAmountToDisburseToday,
        totalLoansDisbursedThisMonth,
        totalAmountDisbursedThisMonth,
      },
    });
  } catch (error) {
    console.error('Get disbursal loans error:', error);
    res.status(500).json({ error: 'Error fetching loans' });
  }
};

// COLLECTION MODULE
export const getCollectionLoans = async (req: AuthRequest, res: Response) => {
  try {
    const { tab, search, filter } = req.query as any;
    const searchText = String(search || '').trim();
    const filterName = String(filter || 'all').trim();

    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\\$&`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buildLoans = async (mongoFilter: any) => {
      let loans = await Loan.find(mongoFilter)
        .populate('borrowerId', 'fullName email')
        .populate('sanctionedBy', 'fullName email')
        .populate('disbursedBy', 'fullName email')
        .sort({ disbursedAt: -1, closedAt: -1, sanctionedAt: -1, createdAt: -1 });

      const enrichedLoans = await Promise.all(
        loans.map(async (loan: any) => {
          const payments = await Payment.find({ loanId: loan._id }).populate('recordedBy', 'fullName email').sort({ paymentDate: -1, createdAt: -1 });
          const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
          const outstandingBalance = Math.max(loan.totalRepayment - totalPaid, 0);
          const repaymentEndDate = loan.disbursedAt
            ? new Date(new Date(loan.disbursedAt).getTime() + loan.tenure * 24 * 60 * 60 * 1000)
            : null;

          return {
            ...loan.toObject(),
            payments,
            totalPaid,
            outstandingBalance,
            paymentCount: payments.length,
            repaymentEndDate,
            isOverdue:
              loan.status !== 'closed' &&
              repaymentEndDate !== null &&
              repaymentEndDate.getTime() < today.getTime(),
            isNearlyDue:
              loan.status !== 'closed' &&
              repaymentEndDate !== null &&
              repaymentEndDate.getTime() >= today.getTime() &&
              repaymentEndDate.getTime() - today.getTime() <= 7 * 24 * 60 * 60 * 1000,
          };
        })
      );

      let filteredLoans = enrichedLoans;
      if (searchText) {
        const regex = new RegExp(escapeRegExp(searchText), 'i');
        filteredLoans = filteredLoans.filter((loan: any) => regex.test(loan.borrowerId?.fullName || '') || regex.test(String(loan._id)));
      }

      if (filterName === 'overdue') {
        filteredLoans = filteredLoans.filter((loan: any) => loan.isOverdue);
      } else if (filterName === 'nearly-due') {
        filteredLoans = filteredLoans.filter((loan: any) => loan.isNearlyDue);
      } else if (filterName === 'recently-disbursed') {
        filteredLoans = filteredLoans.filter((loan: any) => {
          if (!loan.disbursedAt) return false;
          const diff = today.getTime() - new Date(loan.disbursedAt).getTime();
          return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
        });
      }

      return filteredLoans;
    };

    const activeLoans = await buildLoans({ status: 'disbursed' });
    const closedLoans = await buildLoans({ status: 'closed' });

    const activeAmountOutstanding = activeLoans.reduce((sum: number, loan: any) => sum + loan.outstandingBalance, 0);
    const totalAmountCollectedThisMonth = activeLoans.concat(closedLoans).reduce((sum: number, loan: any) => {
      const monthPayments = (loan.payments || []).filter((payment: any) => {
        const paymentDate = new Date(payment.paymentDate || payment.createdAt);
        return paymentDate.getMonth() === today.getMonth() && paymentDate.getFullYear() === today.getFullYear();
      });
      return sum + monthPayments.reduce((paymentSum: number, payment: any) => paymentSum + payment.amount, 0);
    }, 0);
    const totalLoansClosedThisMonth = closedLoans.filter((loan: any) => {
      if (!loan.closedAt) return false;
      const closedAt = new Date(loan.closedAt);
      return closedAt.getMonth() === today.getMonth() && closedAt.getFullYear() === today.getFullYear();
    }).length;

    const loans = tab === 'closed' ? closedLoans : activeLoans;

    res.status(200).json({
      loans,
      summary: {
        totalActiveLoansUnderCollection: activeLoans.length,
        totalAmountOutstandingAcrossAllLoans: activeAmountOutstanding,
        totalAmountCollectedThisMonth,
        totalLoansClosedThisMonth,
      },
    });
  } catch (error) {
    console.error('Get collection loans error:', error);
    res.status(500).json({ error: 'Error fetching loans' });
  }
};

// ADMIN MODULE
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });

    res.status(200).json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
};
