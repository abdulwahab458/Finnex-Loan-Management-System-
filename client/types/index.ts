export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'sales' | 'sanction' | 'disbursement' | 'collection' | 'borrower';
}

export interface BorrowerProfile {
  _id: string;
  userId: string;
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: 'salaried' | 'self-employed' | 'unemployed';
  breStatus: 'passed' | 'failed' | 'pending';
  breFailureReasons: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  _id: string;
  borrowerId: string;
  profileId: string;
  salarySlipUrl: string;
  salarySlipOriginalName: string;
  loanAmount: number;
  tenure: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  status: 'applied' | 'sanctioned' | 'rejected' | 'disbursed' | 'closed';
  rejectionReason?: string;
  sanctionedBy?: string;
  sanctionedAt?: string;
  disbursedBy?: string;
  disbursedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  loanId: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  recordedBy: string;
  createdAt: string;
}
