import { Response } from 'express';
import mongoose from 'mongoose';
import { Loan, BorrowerProfile, Payment } from '../models';
import { calculateSimpleInterest, calculateTotalRepayment } from '../utils/helpers';
import { AuthRequest } from '../middlewares/auth.middleware';

export const applyLoan = async (req: AuthRequest, res: Response) => {
  try {
    const { loanAmount, tenure, salarySlipUrl, salarySlipOriginalName } = req.body;
    const userId = req.user?.userId;

    // Validation
    if (!loanAmount || !tenure || !salarySlipUrl || !salarySlipOriginalName) {
      return res.status(400).json({
        error: 'loanAmount, tenure, salarySlipUrl, and salarySlipOriginalName are required',
      });
    }

    // Validate loan amount and tenure
    if (loanAmount < 50000 || loanAmount > 500000) {
      return res.status(400).json({ error: 'Loan amount must be between ₹50,000 and ₹5,00,000' });
    }

    if (tenure < 30 || tenure > 365) {
      return res.status(400).json({ error: 'Tenure must be between 30 and 365 days' });
    }

    // Check if profile exists
    const profile = await BorrowerProfile.findOne({ userId });
    if (!profile) {
      return res.status(400).json({ error: 'Borrower profile not found' });
    }

    // Check if profile passed BRE
    if (profile.breStatus !== 'passed') {
      return res.status(400).json({ error: 'Profile must pass BRE validation first' });
    }

    // Check if user already has an active loan
    const existingLoan = await Loan.findOne({
      borrowerId: userId,
      status: { $in: ['applied', 'sanctioned', 'disbursed'] },
    });

    if (existingLoan) {
      return res.status(400).json({ error: 'You already have an active loan' });
    }

    // Calculate interest and total repayment
    const interestRate = 12;
    const simpleInterest = calculateSimpleInterest(loanAmount, interestRate, tenure);
    const totalRepayment = calculateTotalRepayment(loanAmount, simpleInterest);

    // Create loan
    const loan = new Loan({
      borrowerId: userId,
      profileId: profile._id,
      salarySlipUrl,
      salarySlipOriginalName,
      loanAmount,
      tenure,
      interestRate,
      simpleInterest,
      totalRepayment,
      status: 'applied',
    });

    await loan.save();

    res.status(201).json({
      message: 'Loan application submitted successfully',
      loan,
    });
  } catch (error) {
    console.error('Apply loan error:', error);
    res.status(500).json({ error: 'Error applying for loan' });
  }
};

export const approveLoan = async (req: AuthRequest, res: Response) => {
  try {
    const { loanId } = req.params;
    const { action, reason } = req.body;
    const userId = req.user?.userId;

    // Validation
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    if (action === 'reject' && !reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Get loan
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Check status
    if (loan.status !== 'applied') {
      return res.status(400).json({ error: 'Loan status must be "applied"' });
    }

    if (action === 'approve') {
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      loan.status = 'sanctioned';
      loan.sanctionedBy = new mongoose.Types.ObjectId(userId);
      loan.sanctionedAt = new Date();
    } else {
      loan.status = 'rejected';
      loan.rejectionReason = reason;
    }

    await loan.save();

    res.status(200).json({
      message: `Loan ${action}ed successfully`,
      loan,
    });
  } catch (error) {
    console.error('Approve loan error:', error);
    res.status(500).json({ error: 'Error processing loan' });
  }
};

export const disburseLoan = async (req: AuthRequest, res: Response) => {
  try {
    const { loanId } = req.params;
    const userId = req.user?.userId;

    // Get loan
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Check status
    if (loan.status !== 'sanctioned') {
      return res.status(400).json({ error: 'Loan status must be "sanctioned"' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    loan.status = 'disbursed';
    loan.disbursedBy = new mongoose.Types.ObjectId(userId);
    loan.disbursedAt = new Date();

    await loan.save();

    res.status(200).json({
      message: 'Loan disbursed successfully',
      loan,
    });
  } catch (error) {
    console.error('Disburse loan error:', error);
    res.status(500).json({ error: 'Error disbursing loan' });
  }
};

export const recordPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { loanId } = req.params;
    const { utrNumber, amount, paymentDate } = req.body;
    const userId = req.user?.userId;

    // Validation
    if (!utrNumber || !amount || !paymentDate) {
      return res.status(400).json({
        error: 'utrNumber, amount, and paymentDate are required',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Get loan
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Check loan status
    if (loan.status !== 'disbursed') {
      return res.status(400).json({ error: 'Loan must be in "disbursed" status' });
    }

    // Check if UTR already exists
    const existingPayment = await Payment.findOne({ utrNumber });
    if (existingPayment) {
      return res.status(400).json({ error: 'UTR number already exists' });
    }

    // Calculate total paid so far
    const payments = await Payment.find({ loanId });
    const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const outstandingBalance = loan.totalRepayment - totalPaid;

    // Check if amount exceeds outstanding balance
    if (amount > outstandingBalance) {
      return res.status(400).json({
        error: `Amount cannot exceed outstanding balance of ₹${outstandingBalance.toLocaleString('en-IN')}`,
      });
    }

    // Create payment
    const payment = new Payment({
      loanId,
      utrNumber,
      amount,
      paymentDate: new Date(paymentDate),
      recordedBy: userId,
    });

    await payment.save();

    // Check if loan should be closed
    const newTotalPaid = totalPaid + amount;
    if (newTotalPaid >= loan.totalRepayment) {
      loan.status = 'closed';
      loan.closedAt = new Date();
      await loan.save();
    }

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment,
      loanClosed: newTotalPaid >= loan.totalRepayment,
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ error: 'Error recording payment' });
  }
};

export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    const { loanId } = req.params;

    const payments = await Payment.find({ loanId })
      .populate('recordedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Error fetching payments' });
  }
};
