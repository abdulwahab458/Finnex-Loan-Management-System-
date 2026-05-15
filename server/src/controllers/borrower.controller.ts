import { Response } from 'express';
import { BorrowerProfile, Loan } from '../models';
import { BREService } from '../services/bre.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createBorrowerProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, pan, dateOfBirth, monthlySalary, employmentMode } = req.body;
    const userId = req.user?.userId;

    // Validation
    if (!fullName || !pan || !dateOfBirth || !monthlySalary || !employmentMode) {
      return res.status(400).json({
        error: 'fullName, pan, dateOfBirth, monthlySalary, and employmentMode are required',
      });
    }

    // Run BRE
    const breResult = BREService.runBRE(new Date(dateOfBirth), monthlySalary, pan, employmentMode);

    if (!breResult.passed) {
      return res.status(422).json({
        error: 'BRE validation failed',
        breFailureReasons: breResult.failureReasons,
      });
    }

    // Check if profile already exists
    const existingProfile = await BorrowerProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({ error: 'Profile already exists for this user' });
    }

    // Ensure PAN is unique across profiles
    const existingPan = await BorrowerProfile.findOne({ pan: pan.toUpperCase() });
    if (existingPan) {
      return res.status(400).json({ error: 'PAN already registered with another profile' });
    }

    // Create profile
    const profile = new BorrowerProfile({
      userId,
      fullName,
      pan: pan.toUpperCase(),
      dateOfBirth: new Date(dateOfBirth),
      monthlySalary,
      employmentMode,
      breStatus: 'passed',
    });

    await profile.save();

    res.status(201).json({
      message: 'Borrower profile created successfully',
      profile,
    });
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({ error: 'Error creating profile' });
  }
};

export const getBorrowerProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const profile = await BorrowerProfile.findOne({ userId }).populate('userId', 'fullName email');

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.status(200).json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
};

export const uploadSalarySlip = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const filePath = `/uploads/${req.file.filename}`;
    const originalName = req.file.originalname;

    res.status(200).json({
      message: 'File uploaded successfully',
      filePath,
      originalName,
      fileName: req.file.filename,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error uploading file' });
  }
};

export const getMyLoan = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const loan = await Loan.findOne({ borrowerId: userId })
      .sort({ createdAt: -1 })
      .populate('borrowerId', 'fullName email')
      .populate('profileId')
      .populate('sanctionedBy', 'fullName email')
      .populate('disbursedBy', 'fullName email');

    if (!loan) {
      return res.status(404).json({ error: 'No loan found' });
    }

    res.status(200).json({ loan });
  } catch (error) {
    console.error('Get loan error:', error);
    res.status(500).json({ error: 'Error fetching loan' });
  }
};
