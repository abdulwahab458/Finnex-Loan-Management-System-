import mongoose, { Schema, Document } from 'mongoose';

export interface IBorrowerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: 'salaried' | 'self-employed' | 'unemployed';
  breStatus: 'passed' | 'failed' | 'pending';
  breFailureReasons: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BorrowerProfileSchema = new Schema<IBorrowerProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  pan: {
    type: String,
    required: true,
    uppercase: true,
    unique: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  monthlySalary: {
    type: Number,
    required: true,
  },
  employmentMode: {
    type: String,
    enum: ['salaried', 'self-employed', 'unemployed'],
    required: true,
  },
  breStatus: {
    type: String,
    enum: ['passed', 'failed', 'pending'],
    default: 'pending',
  },
  breFailureReasons: {
    type: [String],
    default: [],
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

export const BorrowerProfile = mongoose.model<IBorrowerProfile>('borrower_profiles', BorrowerProfileSchema);
