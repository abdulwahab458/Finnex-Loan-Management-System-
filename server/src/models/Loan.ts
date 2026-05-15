import mongoose, { Schema, Document } from 'mongoose';

export interface ILoan extends Document {
  borrowerId: mongoose.Types.ObjectId;
  profileId: mongoose.Types.ObjectId;
  salarySlipUrl: string;
  salarySlipOriginalName: string;
  loanAmount: number;
  tenure: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  status: 'applied' | 'sanctioned' | 'rejected' | 'disbursed' | 'closed';
  rejectionReason?: string;
  sanctionedBy?: mongoose.Types.ObjectId;
  sanctionedAt?: Date;
  disbursedBy?: mongoose.Types.ObjectId;
  disbursedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>({
  borrowerId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  profileId: {
    type: Schema.Types.ObjectId,
    ref: 'borrower_profiles',
    required: true,
  },
  salarySlipUrl: {
    type: String,
    required: true,
  },
  salarySlipOriginalName: {
    type: String,
    required: true,
  },
  loanAmount: {
    type: Number,
    required: true,
    min: 50000,
    max: 500000,
  },
  tenure: {
    type: Number,
    required: true,
    min: 30,
    max: 365,
  },
  interestRate: {
    type: Number,
    default: 12,
  },
  simpleInterest: {
    type: Number,
    required: true,
  },
  totalRepayment: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['applied', 'sanctioned', 'rejected', 'disbursed', 'closed'],
    default: 'applied',
  },
  rejectionReason: {
    type: String,
  },
  sanctionedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
  },
  sanctionedAt: {
    type: Date,
  },
  disbursedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
  },
  disbursedAt: {
    type: Date,
  },
  closedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Loan = mongoose.model<ILoan>('loans', LoanSchema);
