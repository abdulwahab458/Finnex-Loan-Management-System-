import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  loanId: mongoose.Types.ObjectId;
  utrNumber: string;
  amount: number;
  paymentDate: Date;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  loanId: {
    type: Schema.Types.ObjectId,
    ref: 'loans',
    required: true,
  },
  utrNumber: {
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentDate: {
    type: Date,
    required: true,
  },
  recordedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create index for UTR uniqueness
PaymentSchema.index({ utrNumber: 1 }, { unique: true });

export const Payment = mongoose.model<IPayment>('payments', PaymentSchema);
