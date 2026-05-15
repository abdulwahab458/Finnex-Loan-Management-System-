import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const generateToken = (userId: string, email: string, role: string): string => {

  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any
  };
  const secret: string = (process.env.JWT_SECRET as string) || 'secret';

  const token = jwt.sign(
    { userId, email, role },
    secret,
    options
  );
  return token;
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);
  return hashed;
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const calculateSimpleInterest = (
  principal: number,
  rate: number = 12,
  tenureDays: number
): number => {
  return (principal * rate * tenureDays) / (365 * 100);
};

export const calculateTotalRepayment = (principal: number, interest: number): number => {
  return principal + interest;
};
