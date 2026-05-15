// Business Rule Engine (BRE) Service

export interface BREResult {
  passed: boolean;
  failureReasons: string[];
}

export class BREService {
  static validateAge(dateOfBirth: Date): { passed: boolean; reason?: string } {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    if (age < 23 || age > 50) {
      return {
        passed: false,
        reason: `Age must be between 23 and 50 years. Your age is ${age} years.`,
      };
    }

    return { passed: true };
  }

  static validateSalary(monthlySalary: number): { passed: boolean; reason?: string } {
    if (monthlySalary < 25000) {
      return {
        passed: false,
        reason: `Monthly salary must be at least ₹25,000. Your salary is ₹${monthlySalary.toLocaleString('en-IN')}.`,
      };
    }

    return { passed: true };
  }

  static validatePAN(pan: string): { passed: boolean; reason?: string } {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!panRegex.test(pan)) {
      return {
        passed: false,
        reason: 'PAN format is invalid. Expected format: AAAAA0000A (e.g., ABCDE1234F).',
      };
    }

    return { passed: true };
  }

  static validateEmployment(employmentMode: string): { passed: boolean; reason?: string } {
    if (employmentMode === 'unemployed') {
      return {
        passed: false,
        reason: 'Unemployed status is not eligible for loan application.',
      };
    }

    return { passed: true };
  }

  static runBRE(
    dateOfBirth: Date,
    monthlySalary: number,
    pan: string,
    employmentMode: string
  ): BREResult {
    const failureReasons: string[] = [];

    // Check each rule
    const ageCheck = this.validateAge(dateOfBirth);
    if (!ageCheck.passed) {
      failureReasons.push(ageCheck.reason || 'Age validation failed');
    }

    const salaryCheck = this.validateSalary(monthlySalary);
    if (!salaryCheck.passed) {
      failureReasons.push(salaryCheck.reason || 'Salary validation failed');
    }

    const panCheck = this.validatePAN(pan);
    if (!panCheck.passed) {
      failureReasons.push(panCheck.reason || 'PAN validation failed');
    }

    const employmentCheck = this.validateEmployment(employmentMode);
    if (!employmentCheck.passed) {
      failureReasons.push(employmentCheck.reason || 'Employment validation failed');
    }

    return {
      passed: failureReasons.length === 0,
      failureReasons,
    };
  }
}
